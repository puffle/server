import { JSONSchemaType } from 'ajv';
import { MyAjv } from '../../managers/AjvManager';
import { constants } from '../../utils/constants';
import { User } from '../user/User';
import { BaseInstance } from './BaseInstance';

interface ISendMoveArgs { move: number; }

export class SledInstance extends BaseInstance
{
	override id = constants.SLED_ROOM_ID;
	#coinsFallback = 0;
	#coins = [20, 10, 5, 5];

	#schemas = {
		sendMove: MyAjv.compile({
			type: 'object',
			additionalProperties: false,
			required: ['move'],
			properties: {
				move: { type: 'integer', minimum: 1, maximum: 5 },
			},
		} as JSONSchemaType<ISendMoveArgs>),
	};

	// @ts-expect-error - overwriting an arrow function
	#superStart = this.start;

	// @ts-expect-error - overwriting an arrow function
	#superAddListeners = this.addListeners;
	// @ts-expect-error - overwriting an arrow function
	#superRemoveListeners = this.removeListeners;

	/** @override */
	override addListeners = (user: User) =>
	{
		user.events.on('send_move', this.sendMove); // this event also exists on MiniGame plugin (not implemented yet)
		this.#superAddListeners(user);
	};

	override removeListeners = (user: User) =>
	{
		user.events.off('send_move', this.sendMove); // this event also exists on MiniGame plugin (not implemented yet)
		this.#superRemoveListeners(user);
	};

	/** @override */
	override start = () =>
	{
		const users = this.users.map((user) => ({
			username: user!.data.username,
			color: user!.data.color,
			hand: user!.data.hand,
		}));

		this.send('start_game', { users });
		this.#superStart();
	};

	sendMove = (args: ISendMoveArgs, user: User) =>
	{
		if (!this.#schemas.sendMove(args)) return;

		if (args.move === 5)
		{
			this.sendGameOver(user);
			return;
		}

		this.send('send_move', { id: this.getSeat(user), move: args.move }, user);
	};

	sendGameOver = (user: User) =>
	{
		this.remove(user);
		user.updateCoins(this.#coins.shift() ?? this.#coinsFallback, true);
	};
}
