import { PrismaClient } from '@prisma/client';
import ajvKeywords from 'ajv-keywords/dist/definitions';
import { verify } from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { EventEmitter } from 'stream';
import { AjvManager } from '../managers/AjvManager';
import { ConfigManager } from '../managers/ConfigManager';
import { PluginManager } from '../managers/PluginManager';
import { User } from './user';

type MapKey<V> = V extends Socket ? string : number;

export class GameWorld
{
	constructor(id: string, server: Server, configManager: ConfigManager, db: PrismaClient, pluginsDir?: string)
	{
		this.id = id;
		this.server = server;
		this.config = configManager;
		this.db = db;

		this.events = new EventEmitter({ captureRejections: true });
		this.pluginManager = new PluginManager(this, pluginsDir ?? 'game');

		this.server.on('connection', this.onConnection);

		this.updatePopulation();
	}

	id: string;
	server: Server;
	config: ConfigManager;
	db: PrismaClient;
	pluginManager: PluginManager;
	events: EventEmitter;
	ajv: AjvManager = new AjvManager({
		allErrors: true,
		removeAdditional: true,
		keywords: ajvKeywords(),
	});
	users: Map<MapKey<Socket | User>, Socket | User> = new Map();

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
				this.close(socket);
				return;
			}

			verify(auth.key, this.config.data.crypto.secret);

			// TODO: add the same checks as login (perma ban, etc)

			const dbUser = await this.db.users.findUnique({ where: { username: auth.username }, include: { bans_bans_userIdTousers: false } });

			if (dbUser == null)
			{
				this.close(socket);
				return;
			}

			const user = new User(socket, dbUser, this);
			this.users.set(user.dbUser.id, user);
			socket.data = user;
			socket.join('joinedUsers'); // broadcast purposes
			socket.on('disconnect', user.onDisconnect);
			socket.on('message', user.onMessage);
			this.updatePopulation();

			user.send('game_auth', { success: true });
		}
		catch (err)
		{
			this.close(socket);
		}
	};

	close = (user: Socket | User) =>
	{
		if (user instanceof Socket)
		{
			user.disconnect(true);
			this.users.delete(user.id);
			return;
		}

		user.socket.disconnect(true);
		this.users.delete(user.dbUser.id);
		this.updatePopulation();
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
