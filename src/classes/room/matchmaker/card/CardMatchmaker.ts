import { IMatchmaker } from '../../../../types/crumbs';
import { User } from '../../../user/User';
import { Room } from '../../Room';
import { BaseMatchmaker } from '../BaseMatchmaker';

export class CardMatchmaker extends BaseMatchmaker
{
	constructor(data: IMatchmaker, room: Room)
	{
		super(data, room, 2, 10);

		this.start();
	}

	start = () => setInterval(this.tick, 1000);

	tick = () =>
	{
		// TODO
	};

	/** @override */
	override add = (user: User) =>
	{
		if (!user.cards.hasCards) return;

		super.add(user);
	};

	// TODO
}
