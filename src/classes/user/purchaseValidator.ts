import { ICrumbs } from '../../types';
import { User } from '../user';

export class PurchaseValidator
{
	constructor(user: User)
	{
		this.user = user;
	}

	private user: User;

	/*
	item = (id: number) => this.validate(id, 'items', this.user.dbUser.inventory);
	igloo = (id: number) => this.validate(id, 'igloos', this.user.dbUser.igloos);
	furniture = (id: number) => this.validate(id, 'furnitures');
	flooring = (id: number) => this.validate(id, 'floorings', this.user.room.flooring);
	*/

	// TODO: migrate to error code
	validate = (id: number, type: keyof ICrumbs, includes: number[] = []) =>
	{
		if (type !== 'items' && type !== 'igloos' && type !== 'furnitures' && type !== 'floorings') return false;
		const item = this.user.world.crumbs[type][id];

		if (item === undefined) return false;

		if (item.cost > this.user.dbUser.coins)
		{
			this.user.send('error', { error: 'You need more coins.' });
			return false;
		}

		if (includes.includes(id))
		{
			this.user.send('error', { error: 'You already have this item.' });
			return false;
		}

		if (item.patched)
		{
			this.user.send('error', { error: 'This item is not currently available.' });
			return false;
		}

		return item;
	};
}
