import type { User } from '../../classes/user/User';
import type { IGameCommand } from '../../types/types';
import { GameCommand } from '../GameCommand';

export default class Command extends GameCommand implements IGameCommand
{
	name = 'id';
	override rank = 0;

	override onCall(args: string[], user: User): void
	{
		user.send('error', { error: `Your ID: ${user.data.id}` });
	}
}
