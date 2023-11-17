import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { IGamePlugin } from '../../types/types';
import { GamePlugin } from '../GamePlugin';

export default class MatchmakingPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Matchmaking';

	@Event('join_matchmaking')
	joinMatchmaking(args: unknown, user: User)
	{
		if (!user.room?.matchmaker || user.room.matchmaker.includes(user)) return;
		user.room.matchmaker.add(user);
	}

	@Event('leave_matchmaking')
	leaveMatchmaking(args: unknown, user: User)
	{
		if (!user.room?.matchmaker || !user.room.matchmaker.includes(user)) return;
		user.room.matchmaker.remove(user);
	}
}
