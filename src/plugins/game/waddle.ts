import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { IGamePlugin, IntNumberRange, Validate } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IJoinWaddleArgs { waddle: number & IntNumberRange<[0, typeof constants.limits.sql.MAX_UNSIGNED_INTEGER]>; }

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
	joinWaddle(args: Validate<IJoinWaddleArgs>, user: User)
	{
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
