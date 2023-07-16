import { users } from '@prisma/client';
import { DisconnectReason, Socket } from 'socket.io';
import { pick } from '../utils/functions';
import { GameWorld } from './world';

export class User
{
	constructor(socket: Socket, dbUser: users, world: GameWorld)
	{
		this.socket = socket;
		this.world = world;
		this.dbUser = dbUser;
	}

	socket: Socket;
	world: GameWorld;
	dbUser: users;
	room = {
		id: -1,
		x: 0,
		y: 0,
		frame: 1,
	};

	onDisconnectPre = (reason: DisconnectReason) => console.log(`[${this.world.id}] Disconnect from: ${this.dbUser.username} (${this.socket.id}), reason: ${reason}`);

	onDisconnect = async (reason: DisconnectReason /* , description: unknown */) =>
	{
		this.onDisconnectPre(reason);
		this.world.close(this);
	};

	onMessage = async (message: IActionMessage) =>
	{
		this.world.onMessage(message, this);
	};

	send = (action: string, args: TActionMessageArgs = {}) => this.socket.send({ action, args });
	sendRoom = (room: string, action: string, args: TActionMessageArgs = {}) => this.socket.to(room).emit('message', { action, args });

	getSafe: TUserSafe = () => pick(
		this.dbUser,
		'id',
		'username',
		'joinTime',
		'head',
		'face',
		'neck',
		'body',
		'hand',
		'feet',
		'color',
		'photo',
		'flag',
	);

	joinRoom = (roomId: number, x = 0, y = 0) =>
	{
		if (typeof roomId !== 'number' || roomId < 0 || roomId === this.room.id) return;

		const room = this.world.rooms.get(roomId);
		if (room === undefined) return;

		// TODO: add proper checks

		if (this.room.id !== -1) this.leaveRoom(this.room.id);

		this.room.x = x;
		this.room.y = y;
		this.room.frame = 1;

		room.add(this);
	};

	leaveRoom = (roomId: number) => this.world.rooms.get(roomId)?.remove(this);
}
