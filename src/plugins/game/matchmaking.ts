import { GameWorld } from '../../classes/GameWorld';
import { User } from '../../classes/user/User';
import { IGamePlugin } from '../../types/types';
import { GamePlugin } from '../GamePlugin';

export default class MatchmakingPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Matchmaking';

	constructor(world: GameWorld)
	{
		super(world);

		this.events = {
			join_matchmaking: this.joinMatchmaking,
			leave_matchmaking: this.leaveMatchmaking,
		};
	}

	// eslint-disable-next-line class-methods-use-this
	joinMatchmaking = (args: unknown, user: User) =>
	{
		if (!user.room?.matchmaker || user.room.matchmaker.includes(user)) return;
		user.room.matchmaker.add(user);
	};

	// eslint-disable-next-line class-methods-use-this
	leaveMatchmaking = (args: unknown, user: User) =>
	{
		if (!user.room?.matchmaker || !user.room.matchmaker.includes(user)) return;
		user.room.matchmaker.remove(user);
	};
}
