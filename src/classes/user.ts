import { DisconnectReason, Socket } from 'socket.io';
import { GameWorld } from './worlds/GameWorld';
import { LoginWorld } from './worlds/LoginWorld';

export class User
{
	constructor(socket: Socket, world: LoginWorld | GameWorld)
	{
		this.socket = socket;
		this.world = world;
	}

	socket: Socket;
	world: LoginWorld | GameWorld;

	onDisconnecPre = (reason: DisconnectReason) => console.log(`[${this.world.id}] Disconnect from: ${this.socket.id} (${this.socket.handshake.address}), reason: ${reason}`);

	onDisconnect = async (reason: DisconnectReason /* , description: unknown */) =>
	{
		this.onDisconnecPre(reason);
	};

	onMessage = async (message: IActionMessage) =>
	{
		this.world.onMessage(message, this);
	};

	send = (action: string, args: Record<string, unknown> = {}) => this.socket.send({ action, args });
}
