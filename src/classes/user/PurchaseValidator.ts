import { ICrumbs, TItemData } from '../../types';
import { User } from '../User';

export class PurchaseValidator
{
	constructor(user: User)
	{
		this.user = user;
	}

	private user: User;

	item = (id: number) => this.validate(id, 'items', this.user.inventory.items);
	// igloo = (id: number) => this.validate(id, 'igloos', this.user.dbUser.igloos);
	// furniture = (id: number) => this.validate(id, 'furnitures');
	// flooring = (id: number) => this.validate(id, 'floorings', this.user.room.flooring);

	// TODO: migrate to error code
	validate = (id: number, type: keyof ICrumbs, includes: number[] = []) =>
	{
		if (type !== 'items' && type !== 'igloos' && type !== 'furnitures' && type !== 'floorings') return false;
		const item = this.user.world.crumbs[type][id] as undefined | TItemData;

		if (item === undefined) return false;

		if (item.cost > this.user.data.coins)
		{
			this.user.send('error', { error: 'You need more coins.' });
			return false;
		}

		if (includes.includes(id))
		{
			this.user.send('error', { error: 'You already have this item.' });
			return false;
		}

		if (!this.user.isModerator && item.patched)
		{
			this.user.send('error', { error: 'This item is not currently available.' });
			return false;
		}

		if (!this.user.isModerator && item.bait)
		{
			this.user.send('error', { error: 'This item is not currently available.' });
			return false;
		}

		return item;
	};
}