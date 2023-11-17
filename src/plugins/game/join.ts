import typia, { tags } from 'typia';
import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { IGamePlugin } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IJoinRoomArgs
{
	room: number & tags.Type<'uint32'> & tags.Minimum<0> & tags.Maximum<typeof constants.limits.sql.MAX_UNSIGNED_INTEGER>;
	x: number & tags.Type<'uint32'> & tags.Minimum<0> & tags.Maximum<typeof constants.limits.MAX_X>;
	y: number & tags.Type<'uint32'> & tags.Minimum<0> & tags.Maximum<typeof constants.limits.MAX_Y>;
}

interface IJoinIglooArgs
{
	igloo: number & tags.Type<'uint32'> & tags.Minimum<0> & tags.Maximum<typeof constants.limits.sql.MAX_UNSIGNED_INTEGER>;
	x: number & tags.Type<'uint32'> & tags.Minimum<0> & tags.Maximum<typeof constants.limits.MAX_X>;
	y: number & tags.Type<'uint32'> & tags.Minimum<0> & tags.Maximum<typeof constants.limits.MAX_Y>;
}

export default class JoinPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Join';

	@Event('join_room')
	joinRoom(args: IJoinRoomArgs, user: User)
	{
		if (!typia.equals(args)) return;
		user.joinRoom(args.room, args.x, args.y);
	}

	@Event('join_igloo')
	joinIgloo(args: IJoinIglooArgs, user: User)
	{
		if (!typia.equals(args)) return;
		user.joinIgloo(args.igloo, args.x, args.y);
	}
}
