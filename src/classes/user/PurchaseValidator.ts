import { ICrumbs, IItem } from '../../types/crumbs';
import { User } from '../User';
import { Igloo } from '../room/Igloo';

export class PurchaseValidator
{
	constructor(user: User)
	{
		this.user = user;
	}

	private user: User;

	item = (id: number) => this.validate(id, 'items', this.user.inventory.collection.map((x) => x.itemId)) as false | IItem;
	igloo = (id: number) => this.validate(id, 'igloos', this.user.igloos.collection.map((x) => x.iglooId));
	furniture = (id: number) => this.validate(id, 'furnitures');
	flooring = (id: number) => this.validate(id, 'floorings', [(this.user.room as Igloo).dbData.flooring]);

	// TODO: migrate to error code
	validate = (id: number, type: keyof ICrumbs, includes: number[] = []) =>
	{
		if (type !== 'items' && type !== 'igloos' && type !== 'furnitures' && type !== 'floorings') return false;
		const data = this.user.world.crumbs[type][id];

		if (data === undefined) return false;

		if (data.cost > this.user.data.coins)
		{
			this.user.send('error', { error: 'You need more coins.' });
			return false;
		}

		if (includes.includes(id))
		{
			this.user.send('error', { error: 'You already have this item.' });
			return false;
		}

		if (!this.user.isModerator && data.patched)
		{
			this.user.send('error', { error: 'This item is not currently available.' });
			return false;
		}

		if (type === 'items' && !this.user.isModerator && (data as IItem).bait)
		{
			// ? ban user?
			this.user.send('error', { error: 'This item is not currently available.' });
			return false;
		}

		return data;
	};
}
