import { Prisma } from '@prisma/client';
import { DisconnectReason, Socket } from 'socket.io';
import { constants } from '../utils/constants';
import { pick } from '../utils/functions';
import { Room } from './room/room';
import { GameWorld } from './world';

export type TDbUser = Prisma.UserGetPayload<{
	include: {
		ban_userId: true;
	};
}>;

export class User
{
	constructor(socket: Socket, dbUser: TDbUser, world: GameWorld)
	{
		this.socket = socket;
		this.world = world;
		this.dbUser = dbUser;
	}

	socket: Socket;
	world: GameWorld;
	dbUser: TDbUser;

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

	// see DatabaseManager > findAnonymousUser()
	get getAnonymous(): TUserAnonymous
	{
		return pick(
			this.dbUser,
			'id',
			'username',
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
	}

	get getSafe(): TUserSafe
	{
		return {
			...this.getAnonymous,
			joinTime: this.dbUser.joinTime,
		};
	}

	get getSafeRoom(): IUserSafeRoom
	{
		return {
			...this.getSafe,
			...this.roomData,
		};
	}

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
