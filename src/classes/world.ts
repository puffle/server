import { verify } from 'jsonwebtoken';
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
import { PluginManager } from '../managers/PluginManager';
import { IActionMessage, ICrumbs, IGameAuth } from '../types';
import { constants } from '../utils/constants';
import { getSocketAddress } from '../utils/functions';
import { Room } from './room/room';
import { User } from './user';

export class GameWorld
{
	constructor(id: string, server: Server, pluginsDir?: string)
	{
		this.id = id;
		this.server = server;
		this.maxUsers = Config.data.worlds[id]?.maxUsers;

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
	rooms: Map<number, Room>;
	maxUsers: number | undefined;

	onMessage = (message: IActionMessage, user: User) =>
	{
		if (!MyAjv.validators.actionMessage(message))
		{
			console.log(`[${this.id}] Received [INVALID]: ${JSON.stringify(message)} from ${user.data.username} (${user.socket.id})`);
			return;
		}

		console.log(`[${this.id}] Received: ${JSON.stringify(message)} from ${user.data.username} (${user.socket.id})`);
		this.events?.emit(message.action, message.args, user);
	};

	onConnectionPre = (socket: Socket) => console.log(`[${this.id}] New connection from: ${socket.id} (${getSocketAddress(socket)})`);

	onConnection = async (socket: Socket) =>
	{
		try
		{
			this.onConnectionPre(socket);

			const auth = socket.handshake.auth as IGameAuth;
			if (!MyAjv.validators.gameAuth(auth))
			{
				this.closeSocket(socket);
				return;
			}

			verify(auth.key, Config.data.crypto.secret);

			// TODO: add the same checks as login (perma ban, etc)

			const dbUser = await Database.user.findUnique({
				where: { username: auth.username },
				include: {
					ban_userId: {
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

			if (dbUser == null)
			{
				this.closeSocket(socket);
				return;
			}

			// disconnect if already logged in
			const userFound = this.users.get(dbUser.id);
			if (userFound !== undefined) userFound.close();

			const user = new User(socket, dbUser, this);
			try
			{
				this.users.set(user.data.id, user);
				socket.data = user;
				socket.join(constants.JOINEDUSERS_ROOM); // broadcast purposes
				socket.on('disconnect', user.onDisconnect);
				socket.on('message', user.onMessage);
				await this.updatePopulation();
			}
			catch (err)
			{
				// we want to call GameWorld.close() instead of User.close() because
				// an error can happen before setting the "disconnect" listener
				this.close(user);
			}

			user.send('game_auth', { success: true });
		}
		catch (err)
		{
			this.closeSocket(socket);
		}
	};

	close = async (user: User) =>
	{
		user.room?.remove(user);

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
	updatePopulation = async () => Database.world.upsert({
		where: { id: this.id },
		update: { population: this.population },
		create: { id: this.id, population: this.population },
	});
}
