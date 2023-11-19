import { User } from '../../classes/user/User';
import { IGameCommand } from '../../types/types';
import { GameCommand } from '../GameCommand';

export default class Command extends GameCommand implements IGameCommand
{
	name = 'find';
	override rank = 1;

	override onCall(args: string[], user: User): void
	{
		if (!args[0]) return;
		const target = [...this.world.users.values()].find((u) => u.data.username === args[0]);
		if (!target || target.room?.data.name === undefined) return;

		user.send('error', {
			error: `${target.data.username} (ID: ${target.data.id}) is on ${target.room.isIgloo ? 'Igloo' : 'room'}: ${target.room.data.name} (ID: ${target.room.data.id})`,
		});
	}
}
