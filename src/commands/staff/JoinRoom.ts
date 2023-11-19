import { User } from '../../classes/user/User';
import { IGameCommand } from '../../types/types';
import { GameCommand } from '../GameCommand';

export default class Command extends GameCommand implements IGameCommand
{
	name = 'jr';
	override rank = 1;

	override onCall(args: string[], user: User): void
	{
		const roomId = Number(args[0]);
		if (Number.isNaN(roomId))
		{
			// if NaN, then the room arg is a string, so we use room name
			const room = [...this.world.rooms.values()].find((r) => !r.isIgloo && r.data.name === args[0]);
			if (room !== undefined) user.joinRoom(room.data.id);

			return;
		}

		user.joinRoom(roomId);
	}
}
