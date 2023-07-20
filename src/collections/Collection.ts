import { User } from '../classes/user';

export class Collection
{
	constructor(user: User)
	{
		this.user = user;
	}

	user: User;
}
