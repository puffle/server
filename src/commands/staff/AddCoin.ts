import type { User } from '../../classes/user/User';
import type { IGameCommand } from '../../types/types';
import { GameCommand } from '../GameCommand';

export default class Command extends GameCommand implements IGameCommand
{
	name = 'ac';
	override rank = 1;

	override onCall(args: string[], user: User): void
	{
		const coins = Number(args[0]);
		if (Number.isNaN(coins)) return;

		user.updateCoins(coins, true);
	}
}
