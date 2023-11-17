import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { Database } from '../../managers/DatabaseManager';
import { IGamePlugin, IntNumberRange, Validate } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IGetPlayerArgs { id: number & IntNumberRange<[0, typeof constants.limits.sql.MAX_UNSIGNED_INTEGER]>; }

export default class GetPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Get';

	@Event('get_player')
	async getPlayer(args: Validate<IGetPlayerArgs>, user: User)
	{
		// if (user.data.id === args.id) return;

		const requestedUser = this.world.users.get(args.id);
		if (requestedUser !== undefined)
		{
			user.send('get_player', { penguin: requestedUser.getAnonymous });
			return;
		}

		if (!user.buddies.has(args.id)) return;

		const anonUser = await Database.findAnonymousUser(args.id);
		user.send('get_player', { penguin: anonUser });
	}
}
