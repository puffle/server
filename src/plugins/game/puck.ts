import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { IGamePlugin, IntNumberRange, Validate } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IMovePuckArgs
{
	x: number & IntNumberRange<[typeof constants.limits.MAX_X_NEGATIVE, typeof constants.limits.MAX_X]>;
	y: number & IntNumberRange<[typeof constants.limits.MAX_Y_NEGATIVE, typeof constants.limits.MAX_Y]>;
	speedX: number & IntNumberRange<[-127, 127]>; // const speedX = Math.floor((this.target.x - puckX) / this.speedDiv)
	speedY: number & IntNumberRange<[-80, 80]>; // const speedY = Math.floor((this.target.y - puckY) / this.speedDiv)
}

export default class PuckPlugin extends GamePlugin implements IGamePlugin
{
	name = 'Puck';
	#puckX = 0;
	#puckY = 0;

	@Event('get_puck')
	getPuck(args: unknown, user: User)
	{
		if (user.room?.data.id !== constants.RINK_ROOM_ID) return;

		user.send('get_puck', { x: this.#puckX, y: this.#puckY });
	}

	@Event('move_puck')
	movePuck(args: Validate<IMovePuckArgs>, user: User)
	{
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
