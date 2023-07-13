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

	onDisconnect = async (reason: DisconnectReason /* , description: unknown */) =>
	{
		console.log(`[${this.world.id}] Disconnect from: ${this.socket.id} (${this.socket.handshake.address}), reason: ${reason}`);
	};

	onMessage = async (message: IActionMessage) =>
	{
		this.world.onMessage(message, this);
	};
}
