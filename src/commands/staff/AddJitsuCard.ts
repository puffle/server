import type { User } from '../../classes/user/User';
import type { IGameCommand } from '../../types/types';
import { GameCommand } from '../GameCommand';

export default class Command extends GameCommand implements IGameCommand
{
	name = 'ajc';
	override rank = 5;

	override onCall(args: string[], user: User): void
	{
		const cardId = Number(args[0]);
		const card = this.world.crumbs.cards[cardId];
		if (card === undefined)
		{
			user.send('error', { error: 'Card not found!' });
			return;
		}

		user.cards.add(cardId);
		user.send('error', { error: `Adding card: ${card.name}` });
	}
}
