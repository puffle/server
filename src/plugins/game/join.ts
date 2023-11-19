import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { IGamePlugin, IntNumberRange, Validate } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IJoinRoomArgs
{
	room: number & IntNumberRange<[0, typeof constants.limits.sql.MAX_UNSIGNED_INTEGER]>;
	x: number & IntNumberRange<[0, typeof constants.limits.MAX_X]>;
	y: number & IntNumberRange<[0, typeof constants.limits.MAX_Y]>;
}

interface IJoinIglooArgs
{
	igloo: number & IntNumberRange<[0, typeof constants.limits.sql.MAX_UNSIGNED_INTEGER]>;
	x: number & IntNumberRange<[0, typeof constants.limits.MAX_X]>;
	y: number & IntNumberRange<[0, typeof constants.limits.MAX_Y]>;
}

export default class JoinPlugin extends GamePlugin implements IGamePlugin
{
	name = 'Join';

	@Event('join_room')
	joinRoom(args: Validate<IJoinRoomArgs>, user: User)
	{
		user.joinRoom(args.room, args.x, args.y);
	}

	@Event('join_igloo')
	joinIgloo(args: Validate<IJoinIglooArgs>, user: User)
	{
		user.joinIgloo(args.igloo, args.x, args.y);
	}
}
