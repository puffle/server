import { User } from '../../classes/user/User';
import { IGameCommand } from '../../types/types';
import { GameCommand } from '../GameCommand';

export default class Command extends GameCommand implements IGameCommand
{
	name = 'speed';
	override rank = 1;

	override onCall(args: string[], user: User): void
	{
		const value = Number(args[0]);
		if (Number.isNaN(value) || value < -1 || value > 100_000) return;

		user.customData.speed = value;
		user.room?.send(user, 'update_player', {
			id: user.data.id,
			attributes: {
				speed: value,
			},
		}, []);
	}
}
