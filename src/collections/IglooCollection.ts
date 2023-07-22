import { User } from '../classes/User';
import { Database } from '../managers/DatabaseManager';
import { removeItemFromArray } from '../utils/functions';
import { Collection } from './Collection';

export class IglooCollection extends Collection
{
	constructor(user: User)
	{
		super(user);

		this.data = this.user.data.igloo_inventory.map((igloo) => igloo.iglooId);
	}

	data: number[];

	add = async (iglooId: number) => Database.iglooInventory.create({
		data: {
			userId: this.user.data.id,
			iglooId,
		},
	}).then(() =>
	{
		this.data.push(iglooId);
		this.user.data.igloo_inventory.push({ userId: this.user.data.id, iglooId });
	});

	remove = async (iglooId: number) => Database.iglooInventory.deleteMany({
		where: {
			userId: this.user.data.id,
			iglooId,
		},
	}).then(() =>
	{
		removeItemFromArray(this.data, iglooId);
		removeItemFromArray(this.user.data.igloo_inventory, { userId: this.user.data.id, iglooId });
	});

	toJSON = () => this.data;
}
