import { JSONSchemaType } from 'ajv';
import { GameWorld } from '../../classes/GameWorld';
import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { MyAjv } from '../../managers/AjvManager';
import { IGamePlugin } from '../../types/types';
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

		this.schemas = {
			sendPositionOrSnowball: MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['x', 'y'],
				properties: {
					x: { type: 'integer', minimum: 0, maximum: constants.limits.MAX_X },
					y: { type: 'integer', minimum: 0, maximum: constants.limits.MAX_Y },
				},
			} as JSONSchemaType<ISendPositionOrSnowballArgs>),

			sendFrame: MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['frame'],
				properties: {
					set: { type: 'boolean', default: false, nullable: true },
					frame: { type: 'integer', minimum: 1, maximum: constants.limits.MAX_FRAME },
				},
			} as JSONSchemaType<ISendFrameArgs>),
		};
	}

	@Event('send_position')
	sendPosition(args: ISendPositionOrSnowballArgs, user: User)
	{
		if (!this.schemas.sendPositionOrSnowball!(args)) return;

		user.roomData.x = args.x;
		user.roomData.y = args.y;
		user.roomData.frame = 1;

		user.room?.send(user, 'send_position', { id: user.data.id, ...args });
	}

	@Event('send_frame')
	sendFrame(args: ISendFrameArgs, user: User)
	{
		if (!this.schemas.sendFrame!(args)) return;

		user.roomData.frame = args.set ? args.frame : 1;

		user.room?.send(user, 'send_frame', { id: user.data.id, ...args });
	}

	@Event('snowball')
	snowball(args: ISendPositionOrSnowballArgs, user: User)
	{
		if (!this.schemas.sendPositionOrSnowball!(args)) return;
		user.room?.send(user, 'snowball', { id: user.data.id, ...args });
	}
}
