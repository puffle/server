import typia, { tags } from 'typia';
import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { IGamePlugin } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IJoinWaddleArgs { waddle: number & tags.Type<'uint32'> & tags.Minimum<0> & tags.Maximum<typeof constants.limits.sql.MAX_UNSIGNED_INTEGER>; }

export default class WaddlePlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Waddle';

	@Event('get_waddles')
	getWaddles(args: unknown, user: User)
	{
		if (!user.room) return;

		const waddles = Object.fromEntries([...user.room.waddles].map(([waddleId, waddle]) =>
		{
			const users = waddle.users.map((u) => (u ? u.data.username : null));
			return [waddleId, users];
		}));

		user.send('get_waddles', { waddles });
	}

	@Event('join_waddle')
	joinWaddle(args: IJoinWaddleArgs, user: User)
	{
		if (!typia.equals(args)) return;

		const waddle = user.room?.waddles.get(args.waddle);
		if (!waddle || waddle.isFull || user.waddle) return;

		waddle.add(user);
	}

	@Event('leaveWaddle')
	leaveWaddle(args: unknown, user: User)
	{
		user.waddle?.remove(user);
	}
}
