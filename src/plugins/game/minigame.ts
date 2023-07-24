import { JSONSchemaType, ValidateFunction } from 'ajv';
import { GameWorld } from '../../classes/GameWorld';
import { User } from '../../classes/User';
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
			game_over: this.gameOver,
		};

		this.schemas = new Map<string, ValidateFunction<unknown>>([
			['gameOver', MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['coins'],
				properties: {
					coins: { type: 'integer', minimum: 0, maximum: constants.limits.sql.MAX_UNSIGNED_INTEGER },
				},
			} as JSONSchemaType<IGameOverArgs>)],
		]);
	}

	gameOver = (args: IGameOverArgs, user: User) =>
	{
		if (!this.schemas.get('gameOver')!(args)) return;
		if (!user.room?.isGame) return;

		user.updateCoins(args.coins, true);
	};
}
