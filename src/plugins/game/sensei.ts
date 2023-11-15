import { GameWorld } from '../../classes/GameWorld';
import { SenseiInstance } from '../../classes/instance/card/SenseiInstance';
import { User } from '../../classes/user/User';
import { IGamePlugin } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

export default class SenseiPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Sensei';

	constructor(world: GameWorld)
	{
		super(world);

		this.events = {
			join_sensei: this.joinSensei,
		};
	}

	// eslint-disable-next-line class-methods-use-this
	joinSensei = (args: unknown, user: User) =>
	{
		if (user.room?.data.id !== constants.SENSEI_ROOM_ID || !user.cards.hasCards) return;

		// TODO: refactor this
		(new SenseiInstance(user)).init();
	};
}
