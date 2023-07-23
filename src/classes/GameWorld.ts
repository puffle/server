import { verify } from 'jsonwebtoken';
import { clamp } from 'lodash';
import { Server, Socket } from 'socket.io';
import { EventEmitter } from 'stream';
import floorings from '../data/floorings.json';
import furnitures from '../data/furnitures.json';
import igloos from '../data/igloos.json';
import items from '../data/items.json';
import rooms from '../data/rooms.json';
import tables from '../data/tables.json';
import waddles from '../data/waddles.json';
import { MyAjv } from '../managers/AjvManager';
import { Config } from '../managers/ConfigManager';
import { Database } from '../managers/DatabaseManager';
import { Logger } from '../managers/LogManager';
import { PluginManager } from '../managers/PluginManager';
import { ICrumbs } from '../types/crumbs';
import { IActionMessage, IGameAuth } from '../types/types';
import { constants } from '../utils/constants';
import { getIglooId, getSocketAddress } from '../utils/functions';
import { User } from './User';
import { Igloo } from './room/Igloo';
import { Room } from './room/Room';

export class GameWorld
{
	constructor(id: string, server: Server, pluginsDir?: string)
	{
		this.id = id;
		this.server = server;
		this.maxUsers = Config.data.worlds[id]?.maxUsers ?? constants.limits.MAX_USERS;

		this.events = new EventEmitter({ captureRejections: true });
		this.pluginManager = new PluginManager(this, pluginsDir ?? 'game');

		this.rooms = (() =>
		{
			const r = new Map<number, Room>();
			this.crumbs.rooms.forEach((room) =>
			{
				r.set(room.id, new Room({
					id: room.id,
					name: room.name,
					member: room.member,
					maxUsers: room.maxUsers,
					game: room.game,
					spawn: room.spawn,
				}));
			});

			return r;
		})();

		this.server.on('connection', this.onConnection);

		this.updatePopulation();
	}

	id: string;
	server: Server;
	pluginManager: PluginManager;
	events: EventEmitter;
	users: Map<number, User> = new Map();
	crumbs = {
		floorings,
		furnitures,
		igloos,
		items,
		rooms,
		tables,
		waddles,
	} as ICrumbs;
	rooms: Map<number, Room | Igloo>;
	maxUsers: number;

	// eslint-disable-next-line class-methods-use-this
	error = (message: string | Record<string, unknown>) => Logger.error(typeof message === 'string' ? message : JSON.stringify(message));

	onMessage = (message: IActionMessage, user: User) =>
	{
		if (!MyAjv.validators.actionMessage(message)) return;

		Logger.info(`Received: ${JSON.stringify(message)} from ${user.data.username} (${user.socket.id})`);
		this.events?.emit(message.action, message.args, user);
	};

	// eslint-disable-next-line class-methods-use-this
	onConnectionPre = (socket: Socket) => Logger.info(`New connection from: ${socket.id} (${getSocketAddress(socket)})`);

	onConnection = async (socket: Socket) =>
	{
		this.onConnectionPre(socket);

		const auth = socket.handshake.auth as IGameAuth;
		if (!MyAjv.validators.gameAuth(auth))
		{
			this.closeSocket(socket);
			return;
		}

		verify(auth.key, Config.data.crypto.secret, {
			audience: Config.data.crypto.audience,
			issuer: Config.data.crypto.issuer,
			subject: auth.username,
			// jwtid: '', // TODO: check jwtid too?
		});

		const dbUser = await Database.user.findUnique({
			where: { username: auth.username },
			include: {
				auth_tokens: true,
				buddies_userId: true,
				furniture_inventory: true,
				igloo_inventory: true,
				ignores_userId: true,
				inventory: true,
				bans_userId: {
					take: 1,
					where: {
						expires: { gt: new Date() },
					},
					orderBy: {
						expires: 'desc',
					},
				},
			},
		});

		if (dbUser == null // invalid user
			|| (dbUser.rank < constants.FIRST_MODERATOR_RANK && this.population >= this.maxUsers) // max users reached
			|| (dbUser.permaBan || dbUser.bans_userId[0] !== undefined)) // banned user
		{
			this.closeSocket(socket);
			return;
		}

		// disconnect if already logged in
		const userFound = this.users.get(dbUser.id);
		if (userFound !== undefined) userFound.close();

		const user = new User(socket, dbUser, this);
		this.users.set(user.data.id, user);
		socket.data = user;
		socket.join(constants.JOINEDUSERS_ROOM); // broadcast purposes
		socket.on('disconnect', user.onDisconnect);
		socket.on('message', user.onMessage);
		await this.updatePopulation();

		user.send('game_auth', { success: true });
	};

	close = async (user: User) =>
	{
		user.room?.remove(user);

		const igloo = this.rooms.get(getIglooId(user.data.id));
		if (igloo !== undefined && igloo.isIgloo) (igloo as Igloo).locked = true;

		this.closeSocket(user.socket);
		this.users.delete(user.data.id);
		await this.updatePopulation();
	};

	// eslint-disable-next-line class-methods-use-this
	closeSocket = (socket: Socket) =>
	{
		socket.disconnect(true);
	};

	get population()
	{
		return this.users.size;
	}

	/**
	 * Updates world's population
	 * @warning It should be always awaited to prevent race conditions
	 * @async
	 * @returns {Promise}
	 */
	updatePopulation = async () =>
	{
		const population = clamp(this.population, 0, constants.limits.sql.MAX_UNSIGNED_TINYINT);

		return Database.world.upsert({
			where: { id: this.id },
			update: { population },
			create: { id: this.id, population },
		});
	};
}
