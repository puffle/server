import { compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { createHash, randomBytes } from 'node:crypto';
import { Server, Socket } from 'socket.io';
import { ConfigManager } from '../../managers/ConfigManager';
import { BaseWorld } from './BaseWorld';

export class LoginWorld extends BaseWorld
{
	constructor(id: string, server: Server, configManager?: ConfigManager)
	{
		super(id, server, true, configManager);

		this.server.on('connection', this.onConnection);
	}

	override onConnection = async (socket: Socket) =>
	{
		const auth = socket.handshake.auth as ILoginAuth;
		if (!this.ajv.validators.loginAuth(auth))
		{
			// TODO: send error codes
			socket.disconnect(true);
			return;
		}

		socket.send('login', await this.login(socket, auth));
	};

	private login = async (socket: Socket, auth: ILoginAuth) =>
	{
		const user = await this.db.users.findUnique({ where: { username: auth.username }, include: { bans_bans_userIdTousers: false } });

		if (user == null)
		{
			return {
				success: false,
				message: 'not found',
			};
		}

		// TODO: add token login
		const match = await compare(auth.password, user.password);
		if (!match)
		{
			return {
				success: false,
				message: 'invalid password',
			};
		}

		if (user.permaBan)
		{
			return {
				success: false,
				message: 'perma banned',
			};
		}

		// TODO: add temp ban

		const randomKey = randomBytes(32).toString('hex');
		const hash = createHash('sha256')
			.update(`${auth.username}${randomKey}${socket.handshake.address}${socket.request.headers['user-agent']}`)
			.digest('hex');

		const key = sign({ hash }, this.config.data.crypto.secret, { expiresIn: this.config.data.crypto.loginKeyExpiry });

		return {
			success: true,
			username: auth.username,
			key,
			populations: {},
		};
	};
}
