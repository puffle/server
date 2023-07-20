import { User } from '../classes/User';

export class Collection
{
	constructor(user: User)
	{
		this.user = user;
	}

	user: User;
}
