import { JSONSchemaType, ValidateFunction } from 'ajv';
import { User } from '../../classes/user';
import { GameWorld } from '../../classes/world';
import { MyAjv } from '../../managers/AjvManager';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface ISendPositionOrSnowballArgs { x: number; y: number; }
interface ISendFrameArgs { set?: boolean; frame: number; }

export default class ActionPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Action';

	constructor(world: GameWorld)
	{
		super(world);

		this.events = {
			send_position: this.sendPosition,
			send_frame: this.sendFrame,
			snowball: this.snowball,
		};

		this.schemas = new Map<string, ValidateFunction<unknown>>([
			['sendPositionOrSnowball', MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['x', 'y'],
				properties: {
					x: { type: 'integer', minimum: 0, maximum: constants.limits.MAX_X },
					y: { type: 'integer', minimum: 0, maximum: constants.limits.MAX_Y },
				},
			} as JSONSchemaType<ISendPositionOrSnowballArgs>)],

			['sendFrame', MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['frame'],
				properties: {
					set: { type: 'boolean', default: false, nullable: true },
					frame: { type: 'integer', minimum: 1, maximum: constants.limits.MAX_FRAME },
				},
			} as JSONSchemaType<ISendFrameArgs>)],
		]);
	}

	sendPosition = (args: ISendPositionOrSnowballArgs, user: User) =>
	{
		if (!this.schemas.get('sendPositionOrSnowball')!(args)) return;

		user.roomData.x = args.x;
		user.roomData.y = args.y;
		user.roomData.frame = 1;

		user.sendRoom('send_position', { id: user.dbUser.id, ...args });
	};

	sendFrame = (args: ISendFrameArgs, user: User) =>
	{
		if (!this.schemas.get('sendFrame')!(args)) return;

		user.roomData.frame = args.set ? args.frame : 1;

		user.sendRoom('send_frame', { id: user.dbUser.id, ...args });
	};

	snowball = (args: ISendPositionOrSnowballArgs, user: User) => this.schemas.get('sendPositionOrSnowball')!(args) && user.sendRoom('snowball', { id: user.dbUser.id, ...args });
}
