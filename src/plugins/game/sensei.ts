import { SenseiInstance } from '../../classes/instance/card/SenseiInstance';
import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { IGamePlugin } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

export default class SenseiPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Sensei';

	// eslint-disable-next-line class-methods-use-this
	@Event('join_sensei')
	joinSensei(args: unknown, user: User)
	{
		if (user.room?.data.id !== constants.SENSEI_ROOM_ID || !user.cards.hasCards) return;

		// TODO: refactor this
		(new SenseiInstance(user)).init();
	}
}
