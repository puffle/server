import type { User } from '../../classes/user/User';
import type { IGameCommand } from '../../types/types';
import { GameCommand } from '../GameCommand';

export default class Command extends GameCommand implements IGameCommand
{
	name = 'bring';
	override rank = 1;

	override onCall(args: string[], user: User): void
	{
		if (!args[0] || user.data.username === args[0]) return;
		const target = [...this.world.users.values()].find((u) => u.data.username === args[0]);
		if (!target || user.room?.data.id === undefined) return;

		target.joinRoom(user.room.data.id);
	}
}
