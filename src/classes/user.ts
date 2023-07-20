import { Prisma, User as PrismaUser } from '@prisma/client';
import { clamp } from 'lodash';
import { DisconnectReason, Socket } from 'socket.io';
import { InventoryCollection } from '../collections/InventoryCollection';
import { Database } from '../managers/DatabaseManager';
import { AnyKey, IActionMessage, IUserSafeRoom, TActionMessageArgs, TUserAnonymous, TUserSafe } from '../types';
import { constants } from '../utils/constants';
import { EItemSlots } from '../utils/enums';
import { getSocketAddress, pick } from '../utils/functions';
import { Room } from './room/room';
import { GameWorld } from './world';

export type TDbUser = Prisma.UserGetPayload<{
	include: {
		inventory: true,
		auth_tokens: true,
		bans_userId: true,
	};
}>;

export class User
{
	constructor(socket: Socket, dbUser: TDbUser, world: GameWorld)
	{
		this.socket = socket;
		this.world = world;
		this.data = dbUser;
		this.address = getSocketAddress(socket);

		this.inventory = new InventoryCollection(this);
	}

	socket: Socket;
	address: string;
	world: GameWorld;
	data: TDbUser;

	inventory: InventoryCollection;

	room: Room | undefined;
	roomData = {
		x: 0,
		y: 0,
		frame: 1,
	};

	onDisconnectPre = (reason: DisconnectReason) => console.log(`[${this.world.id}] Disconnect from: ${this.data.username} (${this.socket.id}), reason: ${reason}`);

	onDisconnect = async (reason: DisconnectReason /* , description: unknown */) =>
	{
		this.onDisconnectPre(reason);
		this.world.close(this);
	};

	onMessage = async (message: IActionMessage) =>
	{
		this.world.onMessage(message, this);
	};

	close = async () => this.socket.disconnect(true);

	send = (action: string, args: TActionMessageArgs = {}) => this.socket.send({ action, args });
	sendSocketRoom = (room: string, action: string, args: TActionMessageArgs = {}) => this.socket.to(room).emit('message', { action, args });

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	sendRoom = (action: string, args: TActionMessageArgs | any = {}) => this.room?.send(this, action, args);

	// see DatabaseManager > findAnonymousUser()
	get getAnonymous(): TUserAnonymous
	{
		return pick(
			this.data,
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
		) as TUserAnonymous;
	}

	get getSafe(): TUserSafe
	{
		return {
			...this.getAnonymous,
			joinTime: this.data.joinTime,
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
		return this.data.rank >= constants.FIRST_MODERATOR_RANK;
	}

	joinRoom = (roomId: number, x = 0, y = 0) =>
	{
		if (typeof roomId !== 'number' || roomId < 0 || roomId === this.room?.data.id) return;

		const room = this.world.rooms.get(roomId);
		if (room === undefined) return;

		if (!this.isModerator && room.isFull)
		{
			this.send('error', { error: 'Sorry this room is currently full' }); // TODO: migrate to error code
			return;
		}

		this.room?.remove(this);

		this.roomData.x = clamp(x, 0, constants.limits.MAX_X);
		this.roomData.y = clamp(y, 0, constants.limits.MAX_Y);
		this.roomData.frame = 1;

		room.add(this);
	};

	leaveRoom = (roomId: number) => this.world.rooms.get(roomId)?.remove(this);

	dbUpdate = async (data: Partial<PrismaUser>) => Database.user.update({ where: { id: this.data.id }, data });

	updateCoins = async (coins: number, gameOver = false) =>
	{
		const clampedCoins = clamp(this.data.coins + coins, 0, constants.limits.MAX_COINS);

		await this.dbUpdate({
			coins: clampedCoins,
		});

		this.data.coins = clampedCoins;

		if (gameOver) this.send('game_over', { coins: clampedCoins });
	};

	setItem = async (slot: EItemSlots, itemId: number) =>
	{
		if (slot === EItemSlots.award) return;

		const type = EItemSlots[slot]?.toLowerCase() as string | undefined;
		if (type === undefined || (this.data as AnyKey)[type] === itemId) return;

		this.dbUpdate({ [type]: itemId }).then(() =>
		{
			(this.data as AnyKey)[type] = itemId;
		});

		this.room?.send(this, 'update_player', { id: this.data.id, item: itemId, slot: type }, []);
	};
}
