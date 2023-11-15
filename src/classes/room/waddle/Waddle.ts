import { Nullable } from '@n0bodysec/ts-utils';
import { IWaddle } from '../../../types/crumbs';
import { InstanceFactory } from '../../instance/InstanceFactory';
import { User } from '../../user/User';

export class Waddle
{
	constructor(data: IWaddle)
	{
		this.data = data;
		this.users = new Array(data.seats).fill(null);
	}

	data: IWaddle;
	users: Nullable<User>[] = [];

	get isFull()
	{
		return !this.users.includes(null);
	}

	getSeat = (user: User) => this.users.indexOf(user);

	add = (user: User) =>
	{
		if (this.data.game === 'card' && !user.cards.hasCards) return;

		const seat = this.users.indexOf(null);
		this.users[seat] = user;

		user.waddle = this;

		// start game
		if (this.isFull)
		{
			this.start();
			return;
		}

		user.send('join_waddle', { waddle: this.data.id, seat, game: this.data.game });
		user.room?.send(user, 'update_waddle', { waddle: this.data.id, seat, username: user.data.username }, []);
	};

	remove = (user: User) =>
	{
		const seat = this.getSeat(user);
		this.users[seat] = null;

		user.waddle = undefined;
		user.room?.send(user, 'update_waddle', { waddle: this.data.id, seat, username: null }, []);
	};

	start = () =>
	{
		const instance = InstanceFactory.createInstance(this);
		this.reset();
		instance.init();
	};

	reset = () => this.users.forEach((u) => u != null && this.remove(u));
}
