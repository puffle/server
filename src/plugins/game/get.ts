import typia, { tags } from 'typia';
import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { Database } from '../../managers/DatabaseManager';
import { IGamePlugin } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IGetPlayerArgs { id: number & tags.Type<'uint32'> & tags.Minimum<0> & tags.Maximum<typeof constants.limits.sql.MAX_UNSIGNED_INTEGER>; }

export default class GetPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Get';

	@Event('get_player')
	async getPlayer(args: IGetPlayerArgs, user: User)
	{
		if (!typia.equals(args)) return;
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
