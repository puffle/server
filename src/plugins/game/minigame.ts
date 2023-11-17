import typia, { tags } from 'typia';
import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { IGamePlugin } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IGameOverArgs { coins: number & tags.Type<'uint32'> & tags.Minimum<0> & tags.Maximum<typeof constants.limits.sql.MAX_UNSIGNED_INTEGER>; }

export default class MinigamePlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Minigame';

	@Event('game_over')
	gameOver(args: IGameOverArgs, user: User)
	{
		if (!typia.equals(args)) return;
		if (!user.room?.isGame && !user.minigameRoom) return;

		user.updateCoins(args.coins, true);
	}

	// TODO
}
