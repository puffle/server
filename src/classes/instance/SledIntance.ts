import { Int } from 'ts-runtime-checks';
import { NumberRange, Validate } from '../../types/types';
import { constants } from '../../utils/constants';
import { User } from '../user/User';
import { BaseInstance } from './BaseInstance';

interface ISendMoveArgs { move: number & Int & NumberRange<[1, 5]>; }

export class SledInstance extends BaseInstance
{
	override id = constants.SLED_ROOM_ID;
	#coinsFallback = 0;
	#coins = [20, 10, 5, 5];

	/** @override */
	override addListeners(user: User)
	{
		user.events.on('send_move', this.sendMove.bind(this)); // this event also exists on MiniGame plugin (not implemented yet)
		super.addListeners(user);
	}

	override removeListeners(user: User)
	{
		user.events.off('send_move', this.sendMove.bind(this)); // this event also exists on MiniGame plugin (not implemented yet)
		super.removeListeners(user);
	}

	/** @override */
	override start()
	{
		const users = this.users.map((user) => ({
			username: user!.data.username,
			color: user!.data.color,
			hand: user!.data.hand,
		}));

		this.send('start_game', { users });
		super.start();
	}

	sendMove(args: Validate<ISendMoveArgs>, user: User)
	{
		if (args.move === 5)
		{
			this.sendGameOver(user);
			return;
		}

		this.send('send_move', { id: this.getSeat(user), move: args.move }, user);
	}

	sendGameOver(user: User)
	{
		this.remove(user);
		user.updateCoins(this.#coins.shift() ?? this.#coinsFallback, true);
	}
}
