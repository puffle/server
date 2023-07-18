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
import { Room } from './room/room';
import { User } from './user';

export class GameWorld
{
	constructor(id: string, server: Server, pluginsDir?: string)
	{
		this.id = id;
		this.server = server;

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

	onMessage = (message: IActionMessage, user: User) =>
	{
		if (!MyAjv.validators.actionMessage(message))
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
			if (userFound !== undefined) this.close(userFound);

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

	updatePopulation = async () => Database.world.upsert({
		where: { id: this.id },
		update: { population: this.population },
		create: { id: this.id, population: this.population },
	});
}
