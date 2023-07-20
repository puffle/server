import { User } from '../classes/user';
import { Database } from '../managers/DatabaseManager';
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
}
