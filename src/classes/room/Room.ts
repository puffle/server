import { IRoom } from '../../types/crumbs';
import { TActionMessageArgs } from '../../types/types';
import { User } from '../User';

export class Room
{
	constructor(data: IRoom)
	{
		this.data = data;
		this.users = new Map();
		this.socketRoom = 'room' + this.data.id;
	}

	data: IRoom;
	users: Map<number, User>;
	socketRoom: string;

	get userValuesUnsafe()
	{
		return [...this.users.values()];
	}

	get userValues()
	{
		return this.userValuesUnsafe.map((user) => user.getSafeRoom);
	}

	get population()
	{
		return this.users.size;
	}

	get isFull()
	{
		return this.population >= this.data.maxUsers;
	}

	// eslint-disable-next-line class-methods-use-this
	get isIgloo() { return false; }

	get isGame() { return this.data.game > 0; }

	add = (user: User) =>
	{
		user.room = this;
		this.users.set(user.data.id, user);
		user.socket.join(this.socketRoom);

		if (this.isGame)
		{
			user.send('join_room', { game: this.data.id });
			return;
		}

		user.send('join_room', {
			room: this.data.id,
			users: this.userValues,
		});

		this.send(user, 'add_player', { user: user.getSafeRoom });
	};

	remove = (user: User) =>
	{
		user.room = undefined;
		user.socket.leave(this.socketRoom);

		if (!this.isGame) this.send(user, 'remove_player', { user: user.data.id });
		this.users.delete(user.data.id);
	};

	send = (user: User, action: string, args: TActionMessageArgs = {}, filter = [user] /* , excludeIgnored = false */) =>
	{
		this.userValuesUnsafe.filter((u) => !filter.includes(u))
			.forEach((u) => u.send(action, args));
	};
}
