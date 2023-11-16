import { TActionMessageArgs } from '../../../types/types';
import { User } from '../../user/User';

export class MatchmakerPlayer
{
	constructor(user: User, tick: number)
	{
		this.user = user;
		this.tick = tick;
	}

	user: User;
	tick: number;

	send(action: string, args: TActionMessageArgs = {}) { return this.user.send(action, args); }
}
