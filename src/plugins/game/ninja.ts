import { GameWorld } from '../../classes/GameWorld';
import { User } from '../../classes/user/User';
import { IGamePlugin } from '../../types/types';
import { GamePlugin } from '../GamePlugin';

export default class NinjaPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Ninja';

	constructor(world: GameWorld)
	{
		super(world);

		this.events = {
			get_ninja: this.getNinja,
		};
	}

	// eslint-disable-next-line class-methods-use-this
	getNinja = (args: unknown, user: User) => user.send('get_ninja', {
		rank: user.data.ninjaRank,
		progress: user.data.ninjaProgress,
		cards: user.cards,
	});
}
