import { User } from '../../user/User';
import { CardInstance } from './CardInstance';

export class SenseiInstance extends CardInstance
{
	constructor(user: User)
	{
		super([user]);

		this.user = user;
	}

	senseiData = {
		username: 'Sensei',
		color: 14,
		ninjaRank: 10,
		sensei: true,
	};

	user: User;
}
