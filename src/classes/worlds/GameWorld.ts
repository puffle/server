import { verify } from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { ConfigManager } from '../../managers/ConfigManager';
import { User } from '../user';
import { BaseWorld } from './BaseWorld';

export class GameWorld extends BaseWorld
{
	constructor(id: string, server: Server, configManager?: ConfigManager)
	{
		super(id, server, true, configManager);

		this.server.on('connection', this.onConnection);
	}

	override onConnection = async (socket: Socket) =>
	{
		try
		{
			this.onConnectionPre(socket);

			const auth = socket.handshake.auth as IGameAuth;
			if (!this.ajv.validators.gameAuth(auth))
			{
				socket.disconnect(true);
				return;
			}

			verify(auth.key, this.config.data.crypto.secret);

			const user = new User(socket, this);
			socket.data = user;
			socket.on('disconnect', user.onDisconnect);
			socket.on('message', user.onMessage);

			user.send('game_auth', { success: true });
		}
		catch (err)
		{
			socket.disconnect(true);
		}
	};
}
