import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { Validate } from '../../types/types';
import type { IGamePlugin, IntNumberRange } from '../../types/types';
import type { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface ISendPositionOrSnowballArgs
{
	x: number & IntNumberRange<[0, typeof constants.limits.MAX_X]>;
	y: number & IntNumberRange<[0, typeof constants.limits.MAX_Y]>;
}

interface ISendFrameArgs
{
	set?: boolean;
	frame: number & IntNumberRange<[0, typeof constants.limits.MAX_FRAME]>;
}

export default class ActionPlugin extends GamePlugin implements IGamePlugin
{
	name = 'Action';

	@Event('send_position')
	sendPosition(args: Validate<ISendPositionOrSnowballArgs>, user: User)
	{
		user.roomData.x = args.x;
		user.roomData.y = args.y;
		user.roomData.frame = 1;

		user.room?.send(user, 'send_position', { id: user.data.id, ...args });
	}

	@Event('send_frame')
	sendFrame(args: Validate<ISendFrameArgs>, user: User)
	{
		user.roomData.frame = args.set ? args.frame : 1;

		user.room?.send(user, 'send_frame', { id: user.data.id, ...args });
	}

	@Event('snowball')
	snowball(args: Validate<ISendPositionOrSnowballArgs>, user: User)
	{
		user.room?.send(user, 'snowball', { id: user.data.id, ...args });
	}
}
