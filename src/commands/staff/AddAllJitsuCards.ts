import type { User } from '../../classes/user/User';
import type { IGameCommand } from '../../types/types';
import { GameCommand } from '../GameCommand';

export default class Command extends GameCommand implements IGameCommand
{
	name = 'aja';
	override rank = 5;

	override onCall(args: string[], user: User): void
	{
		Object.keys(this.world.crumbs.cards).forEach((card) => user.cards.add(Number(card)));

		user.send('error', { error: 'Adding all cards...' });
	}
}
