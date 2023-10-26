import { IMatchmaker } from '../../../../types/crumbs';
import { User } from '../../../user/User';
import { Room } from '../../Room';
import { BaseMatchmaker } from '../BaseMatchmaker';

export class CardMatchmaker extends BaseMatchmaker
{
	constructor(data: IMatchmaker, room: Room)
	{
		super(data, room, 2, 10);
	}

	/**
	 * hacky way to inherit/override arrow functions
	 * @see: https://basarat.gitbook.io/typescript/future-javascript/arrow-functions#tip-arrow-functions-and-inheritance
	 */
	// #superAdd = this.add;

	override add(user: User)
	{
		if (!user.cards.hasCards) return;

		super.add(user);
	}

	// TODO
}
