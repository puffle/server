import { JSONSchemaType } from 'ajv';
import { GameWorld } from '../../classes/GameWorld';
import { User } from '../../classes/user/User';
import { MyAjv } from '../../managers/AjvManager';
import { IGamePlugin } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IMovePuckArgs
{
	x: number;
	y: number;
	speedX: number;
	speedY: number;
}

export default class PuckPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Puck';
	#puckX = 0;
	#puckY = 0;

	constructor(world: GameWorld)
	{
		super(world);

		this.events = {
			get_puck: this.getPuck,
			move_puck: this.movePuck,
		};

		this.schemas = {
			movePuck: MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['x', 'y', 'speedX', 'speedY'],
				properties: {
					x: { type: 'integer', minimum: -constants.limits.MAX_X, maximum: constants.limits.MAX_X },
					y: { type: 'integer', minimum: -constants.limits.MAX_Y, maximum: constants.limits.MAX_Y },
					speedX: { type: 'integer', minimum: -127, maximum: 127 }, // const speedX = Math.floor((this.target.x - puckX) / this.speedDiv)
					speedY: { type: 'integer', minimum: -80, maximum: 80 }, // const speedY = Math.floor((this.target.y - puckY) / this.speedDiv)
				},
			} as JSONSchemaType<IMovePuckArgs>),
		};
	}

	getPuck = (args: unknown, user: User) =>
	{
		if (user.room?.data.id !== constants.RINK_ROOM_ID) return;

		user.send('get_puck', { x: this.#puckX, y: this.#puckY });
	};

	movePuck = (args: IMovePuckArgs, user: User) =>
	{
		if (!this.schemas.movePuck!(args)) return;

		this.#puckX = args.x;
		this.#puckY = args.y;

		user.room?.send(user, 'move_puck', {
			x: args.x,
			y: args.y,
			speedX: args.speedX,
			speedY: args.speedY,
		});
	};
}
