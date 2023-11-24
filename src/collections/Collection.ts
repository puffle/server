import type { User } from '../classes/user/User';

export class Collection
{
	constructor(user: User)
	{
		this.user = user;
	}

	user: User;
}
