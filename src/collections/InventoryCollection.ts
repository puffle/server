import { Database } from '../managers/DatabaseManager';
import { Collection } from './Collection';

export class InventoryCollection extends Collection
{
	add = async (itemId: number) => Database.inventory.create({
		data: {
			userId: this.user.data.id,
			itemId,
		},
	}).then(() => this.user.data.inventory.push({
		userId: this.user.data.id,
		itemId,
	}));

	map = () => this.user.data.inventory.map((item) => item.itemId);
}
