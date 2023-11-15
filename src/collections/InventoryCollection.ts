import { Database } from '../managers/DatabaseManager';
import { removeItemFromArray } from '../utils/functions';
import { Collection } from './Collection';

export class InventoryCollection extends Collection
{
	get collection() { return this.user.data.inventory; }
	has = (value: number) => this.collection.some((x) => x.itemId === value);

	add = async (itemId: number) => Database.inventory.create({
		data: {
			userId: this.user.data.id,
			itemId,
		},
	}).then(() =>
	{
		this.collection.push({ userId: this.user.data.id, itemId });
	});

	remove = async (itemId: number) => Database.inventory.deleteMany({
		where: {
			userId: this.user.data.id,
			itemId,
		},
	}).then(() =>
	{
		removeItemFromArray(this.collection, { userId: this.user.data.id, itemId });
	});

	toJSON = () => this.collection.map((item) => item.itemId);
}
