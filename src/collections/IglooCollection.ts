import { Database } from '../managers/DatabaseManager';
import { removeItemFromArray } from '../utils/functions';
import { Collection } from './Collection';

export class IglooCollection extends Collection
{
	get collection() { return this.user.data.igloo_inventory; }
	has = (value: number) => this.collection.some((x) => x.iglooId === value);

	add = async (iglooId: number) => Database.iglooInventory.create({
		data: {
			userId: this.user.data.id,
			iglooId,
		},
	}).then(() =>
	{
		this.collection.push({ userId: this.user.data.id, iglooId });
	});

	remove = async (iglooId: number) => Database.iglooInventory.deleteMany({
		where: {
			userId: this.user.data.id,
			iglooId,
		},
	}).then(() =>
	{
		removeItemFromArray(this.collection, { userId: this.user.data.id, iglooId });
	});

	toJSON = () => this.collection.map((x) => x.iglooId);
}
