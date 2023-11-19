import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { IGamePlugin, IntNumberRange, Validate } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IGameOverArgs { coins: number & IntNumberRange<[0, typeof constants.limits.sql.MAX_UNSIGNED_INTEGER]>; }

export default class MinigamePlugin extends GamePlugin implements IGamePlugin
{
	name = 'Minigame';

	@Event('game_over')
	gameOver(args: Validate<IGameOverArgs>, user: User)
	{
		if (!user.room?.isGame && !user.minigameRoom) return;

		user.updateCoins(args.coins, true);
	}

	// TODO
}
