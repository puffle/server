import type { User } from '../../classes/user/User';
import type { IGameCommand } from '../../types/types';
import { GameCommand } from '../GameCommand';

export default class Command extends GameCommand implements IGameCommand
{
	name = 'rooms';
	override rank = 1;

	override onCall(args: string[], user: User): void
	{
		const roomArray: [string, number][] = [...this.world.rooms.values()]
			.filter((room) => room.population !== 0)
			.map((room) => [room.data.name, room.population]);

		const formattedString: string = roomArray.map((room) => `${room[0]}: ${room[1]}`).join(', ');

		user.send('error', { error: 'Users\n\n' + formattedString });
	}
}
