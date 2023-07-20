import { User } from '../classes/User';
import { Database } from '../managers/DatabaseManager';
import { removeItemFromArray } from '../utils/functions';
import { Collection } from './Collection';

export class InventoryCollection extends Collection
{
	constructor(user: User)
	{
		super(user);

		this.items = this.user.data.inventory.map((item) => item.itemId);
	}

	items: number[];

	add = async (itemId: number) => Database.inventory.create({
		data: {
			userId: this.user.data.id,
			itemId,
		},
	}).then(() =>
	{
		this.items.push(itemId);
		this.user.data.inventory.push({ userId: this.user.data.id, itemId });
	});

	remove = async (itemId: number) => Database.inventory.deleteMany({
		where: {
			userId: this.user.data.id,
			itemId,
		},
	}).then(() =>
	{
		removeItemFromArray(this.items, itemId);
		removeItemFromArray(this.user.data.inventory, { userId: this.user.data.id, itemId });
	});
}
