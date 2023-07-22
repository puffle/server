import { FurnitureInventory } from '@prisma/client';
import { User } from '../classes/User';
import { Database } from '../managers/DatabaseManager';
import { Collection } from './Collection';

type IFurnitureCollection = Omit<FurnitureInventory, 'itemId' | 'userId'>;

export class FurnitureCollection extends Collection
{
	constructor(user: User)
	{
		super(user);

		this.user.data.furniture_inventory.forEach((furniture) => this.data.set(furniture.itemId, { quantity: furniture.quantity }));
	}

	data = new Map<number, IFurnitureCollection>();

	getQuantity = (itemId: number) => this.data.get(itemId)?.quantity ?? 0;

	add = async (itemId: number) =>
	{
		const item = this.data.get(itemId);
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

			this.data.set(itemId, { quantity: item.quantity + 1 });

			const found = this.user.data.furniture_inventory.find((x) => x.userId === this.user.data.id && x.itemId === itemId);
			if (found !== undefined) found.quantity += 1;

			return true;
		}

		await Database.furnitureInventory.create({
			data: {
				userId: this.user.data.id,
				itemId,
				quantity: 1,
			},
		});

		this.data.set(itemId, { quantity: 1 });
		this.user.data.furniture_inventory.push({ userId: this.user.data.id, itemId, quantity: 1 });

		return true;
	};

	toJSON = () =>
	{
		const parsed: { [key: number]: number; } = {};
		this.data.forEach((value, key) => { parsed[key] = value.quantity; });

		return parsed;
	};
}
