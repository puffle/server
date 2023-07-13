import { createHash, randomBytes } from 'crypto';
import { sign } from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { ConfigManager } from '../../managers/ConfigManager';
import { BaseWorld } from './BaseWorld';

export class LoginWorld extends BaseWorld
{
	constructor(id: string, server: Server, configManager?: ConfigManager)
	{
		super(id, server, true, configManager);

		this.server.on('connection', this.onConnection);

		this.server.use(async (socket: Socket, next) =>
		{
			// TODO: add ajv to auth
			const auth = socket.handshake.auth as ILoginAuth;
			console.log(auth);

			if (true) // TODO: mimics isValid
			{
				next();
			}
			else
			{
				next(new Error('invalid credentials'));
			}
		});
	}

	override onConnection = async (socket: Socket) =>
	{
		console.log(`[${this.id}] New connection from: ${socket.id} (${socket.handshake.address}) to LOGIN WORLD`);

		const randomKey = randomBytes(32).toString('hex');
		const hash = createHash('sha256')
			.update(`${socket.id}${randomKey}${socket.handshake.address}${socket.request.headers['user-agent']}`) // TODO: replace socket.id with username
			.digest('hex');

		const key = sign({ hash }, this.config.data.crypto.secret, { expiresIn: this.config.data.crypto.loginKeyExpiry });

		socket.send('login', {
			success: true,
			username: 'username',
			key,
			populations: {},
		});
	};
}
