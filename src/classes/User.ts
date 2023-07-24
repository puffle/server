import { Prisma, User as PrismaUser } from '@prisma/client';
import { clamp } from 'lodash';
import { DisconnectReason, Socket } from 'socket.io';
import { BuddyCollection } from '../collections/BuddyCollection';
import { FurnitureCollection } from '../collections/FurnitureCollection';
import { IglooCollection } from '../collections/IglooCollection';
import { InventoryCollection } from '../collections/InventoryCollection';
import { Config } from '../managers/ConfigManager';
import { Database } from '../managers/DatabaseManager';
import { Logger } from '../managers/LogManager';
import { AnyKey, IActionMessage, IUserSafeRoom, TActionMessageArgs, TUserAnonymous, TUserSafe } from '../types/types';
import { constants } from '../utils/constants';
import { EItemSlots } from '../utils/enums';
import { getIglooId, getSocketAddress, pick } from '../utils/functions';
import { GameWorld } from './GameWorld';
import { Igloo } from './room/Igloo';
import { Room } from './room/Room';
import { PurchaseValidator } from './user/PurchaseValidator';

export type TDbUser = Prisma.UserGetPayload<{
	include: {
		auth_tokens: true,
		bans_userId: true,
		buddies_userId: {
			select: {
				buddyId: true,
				buddy: { select: { username: true; }; },
			},
		},
		furniture_inventory: true,
		igloo_inventory: true,
		ignores_userId: true,
		inventory: true,
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
		this.igloos = new IglooCollection(this);
		this.furniture = new FurnitureCollection(this);
		this.buddies = new BuddyCollection(this);
		this.validatePurchase = new PurchaseValidator(this);
	}

	socket: Socket;
	address: string;
	world: GameWorld;
	data: TDbUser;

	inventory: InventoryCollection;
	igloos: IglooCollection;
	furniture: FurnitureCollection;
	buddies: BuddyCollection;
	validatePurchase: PurchaseValidator;

	room: Room | undefined;
	roomData = {
		x: 0,
		y: 0,
		frame: 1,
	};

	onDisconnectPre = (reason: DisconnectReason) => Logger.info(`Disconnect from: ${this.data.username} (${this.socket.id}), reason: ${reason}`);

	onDisconnect = (reason: DisconnectReason /* , description: unknown */) =>
	{
		this.onDisconnectPre(reason);
		this.world.close(this);
	};

	onMessage = (message: IActionMessage) =>
	{
		this.world.onMessage(message, this);
	};

	close = () => this.socket.disconnect(true);

	send = (action: string, args: TActionMessageArgs = {}) => this.socket.send({ action, args });
	sendSocketRoom = (room: string, action: string, args: TActionMessageArgs = {}) => this.socket.to(room).emit('message', { action, args });
	sendRoom = (action: string, args: TActionMessageArgs = {}, filter = [this]) => this.room?.send(this, action, args, filter);

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
		if (roomId < 0 || roomId === this.room?.data.id) return;

		const room = this.world.rooms.get(roomId);
		if (room === undefined) return;

		if (!this.isModerator && room.isFull)
		{
			this.send('error', { error: 'Sorry this room is currently full' }); // TODO: migrate to error code
			return;
		}

		this.room?.remove(this);

		// TODO: add fixSync

		this.roomData.x = clamp(x, 0, constants.limits.MAX_X);
		this.roomData.y = clamp(y, 0, constants.limits.MAX_Y);
		this.roomData.frame = 1;

		room.add(this);
	};

	leaveRoom = (roomId: number) => this.world.rooms.get(roomId)?.remove(this);

	joinIgloo = async (userId: number, x = 0, y = 0) =>
	{
		const iglooId = getIglooId(userId);
		if (iglooId < Config.data.game.iglooIdOffset) return;

		const igloo = this.world.rooms.get(iglooId);
		if (igloo === undefined)
		{
			const res = await Database.igloo.findUnique({
				where: { userId },
				include: {
					user: {
						select: {
							username: true,
							placed_furniture: true,
						},
					},
				},
			});

			if (res == null) return;

			const { user, ...rest } = res;

			const data = {
				id: iglooId,
				name: `${user.username}'s Igloo`,
			};

			this.world.rooms.set(iglooId, new Igloo(user.username, data, rest, user.placed_furniture ?? []));
		}

		this.joinRoom(iglooId, x, y);
	};

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

	setItem = (slot: EItemSlots, itemId: number) =>
	{
		if (slot === EItemSlots.award) return;

		const type = EItemSlots[slot]?.toLowerCase() as string | undefined;
		if (type === undefined || (this.data as AnyKey)[type] === itemId) return;

		this.dbUpdate({ [type]: itemId }).then(() =>
		{
			(this.data as AnyKey)[type] = itemId;
		});

		this.sendRoom('update_player', { id: this.data.id, item: itemId, slot: type }, []);
	};
}
