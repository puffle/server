import { Database } from '../managers/DatabaseManager';
import { Collection } from './Collection';

export class FurnitureCollection extends Collection
{
	get collection() { return this.user.data.furniture_inventory; }
	has = (value: number) => this.collection.some((x) => x.itemId === value);

	getQuantity = (itemId: number) => this.collection.find((item) => item.itemId === itemId)?.quantity ?? 0;

	add = async (itemId: number) =>
	{
		const item = this.collection.find((x) => x.itemId === itemId);
		if (item !== undefined)
		{
			if (item.quantity >= (this.user.world.crumbs.furnitures[itemId]?.max ?? 0)) return false;

			await Database.furnitureInventory.updateMany({
				where: {
					userId: this.user.data.id,
					itemId,
				},
				data: {
					itemId: {
						increment: 1,
					},
				},
			});

			item.quantity++;

			return true;
		}

		await Database.furnitureInventory.create({
			data: {
				userId: this.user.data.id,
				itemId,
				quantity: 1,
			},
		});

		this.collection.push({ userId: this.user.data.id, itemId, quantity: 1 });

		return true;
	};

	toJSON = () =>
	{
		const parsed: { [key: number]: number; } = {};
		this.collection.forEach((f) => { parsed[f.itemId] = f.quantity; });

		return parsed;
	};
}
