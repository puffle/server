import { JSONSchemaType } from 'ajv';
import { GameWorld } from '../../classes/GameWorld';
import { User } from '../../classes/user/User';
import { MyAjv } from '../../managers/AjvManager';
import { IGamePlugin } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IGameOverArgs { coins: number; }

export default class MinigamePlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Minigame';

	constructor(world: GameWorld)
	{
		super(world);

		this.events = {
			game_over: this.gameOver.bind(this),
		};

		this.schemas = {
			gameOver: MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['coins'],
				properties: {
					coins: { type: 'integer', minimum: 0, maximum: constants.limits.sql.MAX_UNSIGNED_INTEGER },
				},
			} as JSONSchemaType<IGameOverArgs>),
		};
	}

	gameOver(args: IGameOverArgs, user: User)
	{
		if (!this.schemas.gameOver!(args)) return;
		if (!user.room?.isGame && !user.minigameRoom) return;

		user.updateCoins(args.coins, true);
	}
}
