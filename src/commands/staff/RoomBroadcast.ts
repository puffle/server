import { User } from '../../classes/user/User';
import { IGameCommand } from '../../types/types';
import { GameCommand } from '../GameCommand';

export default class Command extends GameCommand implements IGameCommand
{
	name = 'rbc';
	override rank = 3;

	override onCall(args: string[], user: User): void
	{
		if (user.room === undefined) return;
		this.world.server.to(user.room.socketRoom).emit('message', { action: 'error', args: { error: 'Broadcast (Current Room):\n\n' + args.join(' ') } });
	}
}
