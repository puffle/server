import { Server, Socket } from 'socket.io';
import { ConfigManager } from '../../managers/ConfigManager';
import { DatabaseManager } from '../../managers/DatabaseManager';
import { User } from '../user';

export class BaseWorld
{
	constructor(id: string, server: Server, ignoreEvents?: boolean, configManager?: ConfigManager)
	{
		this.id = id;
		this.server = server;
		this.config = configManager ?? new ConfigManager();

		if (!ignoreEvents)
		{
			this.server.on('connection', this.onConnection);
		}
	}

	id: string;
	server: Server;
	config: ConfigManager;
	db: DatabaseManager = new DatabaseManager();

	onMessage = (message: IActionMessage, user: User) =>
	{
		// TODO: add ajv to message
		console.log(`[${this.id}] Received: ${JSON.stringify(message)} from ${user.socket.id}`);
	};

	onConnection = async (socket: Socket) =>
	{
		console.log(`[${this.id}] New connection from: ${socket.id} (${socket.handshake.address})`);

		socket.data = new User(socket, this);
		socket.on('disconnect', (socket.data as User).onDisconnect);
		socket.on('message', (socket.data as User).onMessage);
	};
}
