import { clamp } from '@n0bodysec/ts-utils';
import { verify } from 'jsonwebtoken';
import { EventEmitter } from 'node:events';
import { Server, Socket } from 'socket.io';
import { is } from 'ts-runtime-checks';
import cards from '../data/cards.json';
import decks from '../data/decks.json';
import floorings from '../data/floorings.json';
import furnitures from '../data/furnitures.json';
import igloos from '../data/igloos.json';
import items from '../data/items.json';
import matchmakers from '../data/matchmakers.json';
import rooms from '../data/rooms.json';
import tables from '../data/tables.json';
import waddles from '../data/waddles.json';
import { CommandManager } from '../managers/CommandManager';
import { Config } from '../managers/ConfigManager';
import { Database } from '../managers/DatabaseManager';
import { Logger } from '../managers/LogManager';
import { PluginManager } from '../managers/PluginManager';
import { Ratelimiter } from '../managers/RatelimitManager';
import { ICrumbs } from '../types/crumbs';
import { IActionMessage, IGameAuth, Validate } from '../types/types';
import { constants } from '../utils/constants';
import { getIglooId, getSocketAddress } from '../utils/functions';
import { Igloo } from './room/Igloo';
import { Room } from './room/Room';
import { MatchmakerFactory } from './room/matchmaker/MatchmakerFactory';
import { Waddle } from './room/waddle/Waddle';
import { User } from './user/User';

export class GameWorld
{
	constructor(id: string, server: Server)
	{
		this.id = id;
		this.server = server;
		this.maxUsers = Config.data.worlds[id]?.maxUsers ?? constants.limits.MAX_USERS;
		this.pluginManager = new PluginManager(this);
		this.commandManager = new CommandManager(this);

		// init crumbs
		this.setRooms();
		this.setWaddles();
		this.setMatchmakers();

		this.server.on('connection', this.onConnection);
		// this.events.on('error', (error) => Logger.error(error));

		this.updatePopulation();
	}

	id: string;
	server: Server;
	pluginManager: PluginManager;
	commandManager: CommandManager;
	events = new EventEmitter({ captureRejections: true });
	users: Map<number, User> = new Map();
	crumbs = {
		floorings,
		furnitures,
		igloos,
		items,
		rooms,
		tables,
		waddles,
		cards,
		decks,
		matchmakers,
	} as ICrumbs;
	rooms = new Map<number, Room | Igloo>();
	maxUsers: number;

	get population() { return this.users.size; }

	onMessage = async (message: Validate<IActionMessage>, user: User) =>
	{
		if (Ratelimiter.limiters.messages)
		{
			const ret = await Ratelimiter.limiters.connections.consume(user.address).catch(() => false);
			if (!ret) return;
		}

		Logger.info(`Received: ${JSON.stringify(message)} from ${user.data.username} (${user.socket.id})`);
		this.events.emit(message.action, message.args, user);
		user.events.emit(message.action, message.args, user);
	};

	// eslint-disable-next-line class-methods-use-this
	onConnectionPre = (socket: Socket) => Logger.info(`New connection from: ${socket.id} (${getSocketAddress(socket)})`);

	onConnection = async (socket: Socket) =>
	{
		this.onConnectionPre(socket);

		if (Ratelimiter.limiters.connections)
		{
			const ret = await Ratelimiter.limiters.connections.consume(getSocketAddress(socket)).catch(() => false);
			if (!ret) return;
		}

		if (!is<IGameAuth>(socket.handshake.auth))
		{
			this.closeSocket(socket);
			return;
		}

		const auth = socket.handshake.auth;

		verify(auth.key, Config.data.crypto.secret, {
			audience: Config.data.crypto.audience,
			issuer: Config.data.crypto.issuer,
			subject: auth.username,
			// jwtid: '', // TODO: check jwtid too?
		});

		const dbUser = await Database.user.findUnique({
			where: { username: auth.username },
			include: {
				inventory: true,
				furniture_inventory: true,
				igloo_inventory: true,
				cards: true,
				buddies_userId: {
					select: {
						buddyId: true,
						buddy: { select: { username: true } },
					},
				},
				ignores_userId: {
					select: {
						ignoreId: true,
						ignoredUser: { select: { username: true } },
					},
				},
				bans_userId: {
					take: 1,
					where: { expires: { gt: new Date() } },
					orderBy: { expires: 'desc' },
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

		user.send('load_player', {
			user: user.getSafe,
			rank: user.data.rank,
			coins: user.data.coins,
			// implicit 'toJSON()' call
			buddies: user.buddies,
			ignores: user.ignores,
			inventory: user.inventory,
			igloos: user.igloos,
			furniture: user.furniture,
		});

		const spawn = this.getSpawn();
		if (spawn === undefined) return;

		// sending the coordinates (x, y) = (0, 0) does not synchronize the player,
		// causing him to be seen in a different position from where the other players see him.
		// this is not a bug, but the normal operation in AS2.
		user.joinRoom(spawn);
	};

	close = async (user: User) =>
	{
		user.room?.remove(user);
		user.buddies.sendOffline();
		user.waddle?.remove(user);
		user.minigameRoom?.remove(user);

		const igloo = this.rooms.get(getIglooId(user.data.id));
		if (igloo !== undefined && igloo.isIgloo) (igloo as Igloo).locked = true;

		this.closeSocket(user.socket);
		this.users.delete(user.data.id);
		await this.updatePopulation();
	};

	// eslint-disable-next-line class-methods-use-this
	closeSocket = (socket: Socket) => socket.disconnect(true);

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

	getSpawn = () =>
	{
		const preferredSpawn = Config.data.game.preferredSpawn;

		if (preferredSpawn !== 0)
		{
			const room = this.rooms.get(preferredSpawn);
			if (room !== undefined && !room.isFull && !room.isIgloo) return room.data.id;
		}

		const roomsArr = [...this.rooms];
		let spawns = roomsArr.filter((room) => room[1].data.spawn && !room[1].isFull && !room[1].isIgloo);
		if (!spawns.length) spawns = roomsArr.filter((room) => !room[1].isGame && !room[1].isFull && !room[1].isIgloo);

		return spawns[Math.floor(Math.random() * spawns.length)]?.[0];
	};

	setRooms = () => this.crumbs.rooms.forEach((room) =>
	{
		this.rooms.set(room.id, new Room({
			id: room.id,
			name: room.name,
			member: room.member,
			maxUsers: room.maxUsers,
			game: room.game,
			spawn: room.spawn,
		}));
	});

	setWaddles = () => this.crumbs.waddles.forEach((waddle) =>
	{
		this.rooms.get(waddle.roomId)?.waddles.set(waddle.id, new Waddle(waddle));
	});

	setMatchmakers = () => Object.entries(this.crumbs.matchmakers).forEach((mm) =>
	{
		const mmId = Number(mm[0]);
		if (!Number.isNaN(mmId))
		{
			const room = this.rooms.get(mmId);
			if (room !== undefined) room.matchmaker = MatchmakerFactory.createMatchmaker(mm[1], room);
		}
	});
}
