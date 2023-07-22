import { Furniture, Igloo as PrismaIgloo } from '@prisma/client';
import { Database } from '../../managers/DatabaseManager';
import { IRoom } from '../../types/crumbs';
import { IRoomIgloo } from '../../types/types';
import { User } from '../User';
import { Room } from './Room';

export class Igloo extends Room
{
	constructor(ownerUsername: string, data: IRoomIgloo, dbData: PrismaIgloo, furniture: Furniture[])
	{
		data.member = 0;
		data.maxUsers = 0;
		data.game = 0;
		data.spawn = 0;

		super(data as IRoom);

		this.ownerUsername = ownerUsername;
		this.dbData = dbData;

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		this.furniture = furniture.map(({ id, ...rest }) => rest);
	}

	ownerUsername: string;
	dbData: PrismaIgloo;
	furniture: Omit<Furniture, 'id'>[];
	locked = true;

	dbUpdate = async (data: Partial<PrismaIgloo>) => Database.igloo.update({ where: { userId: this.dbData.userId }, data });

	clearFurniture = async () =>
	{
		await Database.furniture.deleteMany({ where: { userId: this.dbData.userId } });
		this.furniture = [];
	};

	override add = (user: User) =>
	{
		user.room = this;
		this.users.set(user.data.id, user);
		user.socket.join(this.socketRoom);

		user.send('join_igloo', this.toJSON());
		this.send(user, 'add_player', { user: user.getSafeRoom });
	};

	refresh = (user: User) =>
	{
		this.users.forEach((u) =>
		{
			u.roomData.x = 0;
			u.roomData.y = 0;
			u.roomData.frame = 1;
		});

		this.send(user, 'join_igloo', this.toJSON(), []);
	};

	toJSON = () => ({
		igloo: this.dbData.userId,
		users: this.userValues,
		type: this.dbData.type,
		flooring: this.dbData.flooring,
		music: this.dbData.music,
		furniture: this.furniture,
		location: this.dbData.location,
	});

	// eslint-disable-next-line class-methods-use-this
	override get isIgloo() { return true; }

	// eslint-disable-next-line class-methods-use-this
	override get isFull() { return false; }
}
