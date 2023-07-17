import ajvKeywords from 'ajv-keywords/dist/definitions';
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
import { AjvManager } from '../managers/AjvManager';
import { ConfigManager } from '../managers/ConfigManager';
import { DatabaseManager } from '../managers/DatabaseManager';
import { PluginManager } from '../managers/PluginManager';
import { Room } from './room/room';
import { User } from './user';

export class GameWorld
{
	constructor(id: string, server: Server, configManager: ConfigManager, db: DatabaseManager, pluginsDir?: string)
	{
		this.id = id;
		this.server = server;
		this.config = configManager;
		this.db = db;

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
					member: room.member === 1,
					maxUsers: room.maxUsers,
					game: room.game === 1,
					spawn: room.spawn === 1,
				}));
			});

			return r;
		})();

		this.server.on('connection', this.onConnection);

		this.updatePopulation();
	}

	id: string;
	server: Server;
	config: ConfigManager;
	db: DatabaseManager;
	pluginManager: PluginManager;
	events: EventEmitter;
	ajv: AjvManager = new AjvManager({
		allErrors: true,
		removeAdditional: true,
		keywords: ajvKeywords(),
	});
	users: Map<number, User> = new Map();
	crumbs = {
		floorings,
		furnitures,
		igloos,
		items,
		rooms,
		tables,
		waddles,
	};
	rooms: Map<number, Room>;

	onMessage = (message: IActionMessage, user: User) =>
	{
		if (!this.ajv.validators.actionMessage(message))
		{
			console.log(`[${this.id}] Received [INVALID]: ${JSON.stringify(message)} from ${user.dbUser.username} (${user.socket.id})`);
			return;
		}

		console.log(`[${this.id}] Received: ${JSON.stringify(message)} from ${user.dbUser.username} (${user.socket.id})`);
		this.events?.emit(message.action, message.args, user);
	};

	onConnectionPre = (socket: Socket) => console.log(`[${this.id}] New connection from: ${socket.id} (${socket.handshake.address})`);

	onConnection = async (socket: Socket) =>
	{
		try
		{
			this.onConnectionPre(socket);

			const auth = socket.handshake.auth as IGameAuth;
			if (!this.ajv.validators.gameAuth(auth))
			{
				this.closeSocket(socket);
				return;
			}

			verify(auth.key, this.config.data.crypto.secret);

			// TODO: add the same checks as login (perma ban, etc)

			const dbUser = await this.db.users.findUnique({ where: { username: auth.username }, include: { bans_bans_userIdTousers: false } });

			if (dbUser == null)
			{
				this.closeSocket(socket);
				return;
			}

			const user = new User(socket, dbUser, this);
			try
			{
				this.users.set(user.dbUser.id, user);
				socket.data = user;
				socket.join('joinedUsers'); // broadcast purposes
				socket.on('disconnect', user.onDisconnect);
				socket.on('message', user.onMessage);
				this.updatePopulation();
			}
			catch (err)
			{
				this.close(user);
			}

			user.send('game_auth', { success: true });
		}
		catch (err)
		{
			this.closeSocket(socket);
		}
	};

	close = (user: User) =>
	{
		user.room?.remove(user);

		this.closeSocket(user.socket);
		this.users.delete(user.dbUser.id);
		this.updatePopulation();
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

	updatePopulation = async () => this.db.worlds.upsert({
		where: { id: this.id },
		update: { population: this.population },
		create: { id: this.id, population: this.population },
	});
}
