import typia, { tags } from 'typia';
import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { IGamePlugin } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface ISendPositionOrSnowballArgs
{
	x: number & tags.Type<'uint32'> & tags.Minimum<0> & tags.Maximum<typeof constants.limits.MAX_X>;
	y: number & tags.Type<'uint32'> & tags.Minimum<0> & tags.Maximum<typeof constants.limits.MAX_Y>;
}

interface ISendFrameArgs
{
	set?: boolean & tags.Default<false>;
	frame: number & tags.Type<'uint32'> & tags.Minimum<1> & tags.Maximum<typeof constants.limits.MAX_FRAME>;
}

export default class ActionPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Action';

	@Event('send_position')
	sendPosition(args: ISendPositionOrSnowballArgs, user: User)
	{
		if (!typia.equals(args)) return;

		user.roomData.x = args.x;
		user.roomData.y = args.y;
		user.roomData.frame = 1;

		user.room?.send(user, 'send_position', { id: user.data.id, ...args });
	}

	@Event('send_frame')
	sendFrame(args: ISendFrameArgs, user: User)
	{
		if (!typia.equals(args)) return;

		user.roomData.frame = args.set ? args.frame : 1;

		user.room?.send(user, 'send_frame', { id: user.data.id, ...args });
	}

	@Event('snowball')
	snowball(args: ISendPositionOrSnowballArgs, user: User)
	{
		if (!typia.equals(args)) return;
		user.room?.send(user, 'snowball', { id: user.data.id, ...args });
	}
}
