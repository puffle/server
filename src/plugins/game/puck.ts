import typia, { tags } from 'typia';
import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { IGamePlugin } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IMovePuckArgs
{
	x: number & tags.Type<'int32'> & tags.Minimum<typeof constants.limits.MIN_X> & tags.Maximum<typeof constants.limits.MAX_X>;
	y: number & tags.Type<'int32'> & tags.Minimum<typeof constants.limits.MIN_Y> & tags.Maximum<typeof constants.limits.MAX_Y>;
	speedX: number & tags.Type<'int32'> & tags.Minimum<-127> & tags.Maximum<127>; // const speedX = Math.floor((this.target.x - puckX) / this.speedDiv)
	speedY: number & tags.Type<'int32'> & tags.Minimum<-80> & tags.Maximum<80>; // const speedY = Math.floor((this.target.y - puckY) / this.speedDiv)
}

export default class PuckPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Puck';
	#puckX = 0;
	#puckY = 0;

	@Event('get_puck')
	getPuck(args: unknown, user: User)
	{
		if (user.room?.data.id !== constants.RINK_ROOM_ID) return;

		user.send('get_puck', { x: this.#puckX, y: this.#puckY });
	}

	@Event('move_puck')
	movePuck(args: IMovePuckArgs, user: User)
	{
		if (!typia.equals(args)) return;

		this.#puckX = args.x;
		this.#puckY = args.y;

		user.room?.send(user, 'move_puck', {
			x: args.x,
			y: args.y,
			speedX: args.speedX,
			speedY: args.speedY,
		});
	}
}
