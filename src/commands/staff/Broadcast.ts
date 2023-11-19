import { IGameCommand } from '../../types/types';
import { constants } from '../../utils/constants';
import { GameCommand } from '../GameCommand';

export default class Command extends GameCommand implements IGameCommand
{
	name = 'bc';
	override rank = 5;

	override onCall(args: string[]): void
	{
		this.world.server.to(constants.JOINEDUSERS_ROOM).emit('message', { action: 'error', args: { error: 'Broadcast:\n\n' + args.join(' ') } });
	}
}
