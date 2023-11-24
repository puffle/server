import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import type { IGamePlugin } from '../../types/types';
import { GamePlugin } from '../GamePlugin';

export default class NinjaPlugin extends GamePlugin implements IGamePlugin
{
	name = 'Ninja';

	@Event('get_ninja')
	getNinja(args: unknown, user: User)
	{
		user.send('get_ninja', {
			rank: user.data.ninjaRank,
			progress: user.data.ninjaProgress,
			cards: user.cards,
		});
	}
}
