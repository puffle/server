import type { IRoom } from '../../types/crumbs';
import type { TActionMessageArgs } from '../../types/types';
import type { User } from '../user/User';
import type { BaseMatchmaker } from './matchmaker/BaseMatchmaker';
import type { Waddle } from './waddle/Waddle';

export class Room
{
	constructor(data: IRoom)
	{
		this.data = data;
		this.socketRoom = 'room' + this.data.id;
	}

	data: IRoom;
	users: Map<number, User> = new Map();
	waddles: Map<number, Waddle> = new Map();
	matchmaker?: BaseMatchmaker;
	socketRoom: string;

	get userValuesUnsafe() { return [...this.users.values()]; }
	get userValues() { return this.userValuesUnsafe.map((user) => user.getSafeRoom); }
	get population() { return this.users.size; }
	get isFull() { return this.population >= this.data.maxUsers; }
	get isIgloo() { return false; } // eslint-disable-line class-methods-use-this
	get isGame() { return this.data.game > 0; }

	add(user: User)
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
	}

	remove(user: User)
	{
		user.room = undefined;
		user.socket.leave(this.socketRoom);

		if (!this.isGame) this.send(user, 'remove_player', { user: user.data.id });
		if (this.matchmaker?.includes(user)) this.matchmaker.remove(user);

		this.users.delete(user.data.id);
	}

	send(user: User, action: string, args: TActionMessageArgs = {}, filter = [user], excludeIgnored = false)
	{
		// if (user.room?.isGame) return; // ignore if the player is in a game room

		this.userValuesUnsafe.filter((u) => !filter.includes(u) && !(excludeIgnored && u.ignores.has(user.data.id)))
			.forEach((u) => u.send(action, args));
	}
}
