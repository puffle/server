import type { User } from '../../classes/user/User';
import type { IGameCommand } from '../../types/types';
import { GameCommand } from '../GameCommand';

export default class Command extends GameCommand implements IGameCommand
{
	name = 'alpha';
	override rank = 1;

	override onCall(args: string[], user: User): void
	{
		const value = Number(args[0]);
		if (Number.isNaN(value) || value < 0 || value > 1) return;

		user.customData.alpha = value;
		user.room?.send(user, 'update_player', {
			id: user.data.id,
			attributes: {
				alpha: value,
			},
		}, []);
	}
}
