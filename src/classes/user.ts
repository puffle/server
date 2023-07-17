import { users } from '@prisma/client';
import { DisconnectReason, Socket } from 'socket.io';
import { constants } from '../utils/constants';
import { pick } from '../utils/functions';
import { Room } from './room/room';
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

	room: Room | undefined;
	roomData = {
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
	sendSocketRoom = (room: string, action: string, args: TActionMessageArgs = {}) => this.socket.to(room).emit('message', { action, args });

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	sendRoom = (action: string, args: TActionMessageArgs | any = {}) => this.room?.send(this, action, args);

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

	getSafeRoom = () => ({
		...this.getSafe(),
		x: this.roomData.x,
		y: this.roomData.y,
		frame: this.roomData.frame,
	});

	get isModerator()
	{
		return this.dbUser.rank >= constants.FIRST_MODERATOR_RANK;
	}

	joinRoom = (roomId: number, x = 0, y = 0) =>
	{
		if (typeof roomId !== 'number' || roomId < 0 || roomId === this.room?.data.id) return;

		const room = this.world.rooms.get(roomId);
		if (room === undefined) return;

		// TODO: add proper checks

		this.room?.remove(this);

		this.roomData.x = x;
		this.roomData.y = y;
		this.roomData.frame = 1;

		room.add(this);
	};

	leaveRoom = (roomId: number) => this.world.rooms.get(roomId)?.remove(this);
}
