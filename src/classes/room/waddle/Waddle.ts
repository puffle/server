import { IWaddle } from '../../../types/crumbs';
import { InstanceFactory } from '../../instance/InstanceFactory';
import { User } from '../../user/User';

export class Waddle
{
	constructor(data: IWaddle)
	{
		this.data = data;
	}

	data: IWaddle;
	users: User[] = [];

	get isFull()
	{
		return this.users.length >= this.data.seats;
	}

	getSeat = (user: User) => this.users.indexOf(user);

	add = (user: User) =>
	{
		if (this.data.game === 'card' && !user.cards.hasCards) return;

		const seat = this.getSeat(user);
		this.users.splice(seat, 1);

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
		this.users.splice(seat, 1);

		user.waddle = undefined;
		user.room?.send(user, 'update_waddle', { waddle: this.data.id, seat, username: null }, []);
	};

	start = () =>
	{
		const instance = InstanceFactory.createInstance(this);
		this.reset();
		instance.init();
	};

	reset = () => this.users.forEach((u) => this.remove(u));
}
