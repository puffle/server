import { User } from '../../classes/user/User';
import { IGameCommand } from '../../types/types';
import { GameCommand } from '../GameCommand';

export default class Command extends GameCommand implements IGameCommand
{
	name = 'room';
	override rank = 0;

	override onCall(args: string[], user: User): void
	{
		user.send('error', { error: `Room: ${user.room?.data.name} (${user.room?.data.id})\nUsers: ${user.room?.population}` });
	}
}
