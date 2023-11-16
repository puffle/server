import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { IGamePlugin } from '../../types/types';
import { GamePlugin } from '../GamePlugin';

export default class NinjaPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Ninja';

	// eslint-disable-next-line class-methods-use-this
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
