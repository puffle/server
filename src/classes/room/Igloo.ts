import type { Furniture, Igloo as PrismaIgloo } from '@prisma/client';
import { Database } from '../../managers/DatabaseManager';
import type { IRoom } from '../../types/crumbs';
import type { TRoomIgloo } from '../../types/types';
import type { User } from '../user/User';
import { Room } from './Room';

export class Igloo extends Room
{
	constructor(ownerUsername: string, data: TRoomIgloo, dbData: PrismaIgloo, furniture: Furniture[])
	{
		data.member = 0;
		data.maxUsers = 0;
		data.game = 0;
		data.spawn = 0;

		super(data as IRoom);

		this.ownerUsername = ownerUsername;
		this.dbData = dbData;
		this.furniture = furniture.map(({ id, ...rest }) => rest); // eslint-disable-line @typescript-eslint/no-unused-vars
	}

	ownerUsername: string;
	dbData: PrismaIgloo;
	furniture: Omit<Furniture, 'id'>[];
	locked = true;

	async dbUpdate(data: Partial<PrismaIgloo>) { return Database.igloo.update({ where: { userId: this.dbData.userId }, data }); }

	async clearFurniture()
	{
		await Database.furniture.deleteMany({ where: { userId: this.dbData.userId } });
		this.furniture = [];
	}

	/** @override */
	override add(user: User)
	{
		user.room = this;
		this.users.set(user.data.id, user);
		user.socket.join(this.socketRoom);

		user.send('join_igloo', this.toJSON());
		this.send(user, 'add_player', { user: user.getSafeRoom });
	}

	refresh(user: User)
	{
		this.users.forEach((u) =>
		{
			u.roomData.x = 0;
			u.roomData.y = 0;
			u.roomData.frame = 1;
		});

		this.send(user, 'join_igloo', this.toJSON(), []);
	}

	toJSON()
	{
		return {
			igloo: this.dbData.userId,
			users: this.userValues,
			type: this.dbData.type,
			flooring: this.dbData.flooring,
			music: this.dbData.music,
			furniture: this.furniture,
			location: this.dbData.location,
		};
	}

	/** @override */
	override get isIgloo() { return true; } // eslint-disable-line class-methods-use-this

	/** @override */
	override get isFull() { return false; } // eslint-disable-line class-methods-use-this
}
