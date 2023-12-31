import type { Nullable } from '@n0bodysec/ts-utils';
import type { TActionMessageArgs } from '../../types/types';
import type { Waddle } from '../room/waddle/Waddle';
import type { User } from '../user/User';

export class BaseInstance
{
	constructor(users: Nullable<User>[], waddle?: Waddle)
	{
		this.users = Array.from(users); // copy array instead of referecing it
		this.waddle = waddle;
	}

	id: Nullable<number> = null;
	users: Nullable<User>[];
	ready: User[] = []; // don't start until all users are ready
	started = false;
	waddle: Waddle | undefined;

	init()
	{
		this.users.forEach((user) =>
		{
			if (this.id != null && user != null)
			{
				this.addListeners(user);
				user.joinRoom(this.id);
				user.minigameRoom = this;
			}
		});
	}

	addListeners(user: User)
	{
		user.events.on('start_game', this.handleStartGame.bind(this));
		user.events.on('leave_game', this.handleLeaveGame.bind(this));
	}

	removeListeners(user: User)
	{
		user.events.off('start_game', this.handleStartGame.bind(this));
		user.events.off('leave_game', this.handleLeaveGame.bind(this));
	}

	handleStartGame(args: TActionMessageArgs, user: User)
	{
		if (!this.started && !this.ready.includes(user))
		{
			this.ready.push(user);
			this.checkStart();
		}
	}

	handleLeaveGame(args: TActionMessageArgs, user: User)
	{
		this.remove(user);
	}

	checkStart()
	{
		// compare with non null values in case user disconnects
		if (this.ready.length === this.users.length)
		{
			this.start();
		}
	}

	start() { this.started = true; }

	remove(user: User)
	{
		this.removeListeners(user);

		// remove from users
		const seat = this.getSeat(user);
		this.users[seat] = null;

		// remove from ready
		this.ready = this.ready.filter((u) => u !== user);

		user.minigameRoom = null;
	}

	getSeat(user: User) { return this.users.indexOf(user); }

	send(action: string, args: TActionMessageArgs = {}, user: Nullable<User> = null, filter = [user])
	{
		const users = this.users.filter((u) => !filter.includes(u));
		users.forEach((u) => u != null && u.send(action, args));
	}
}
