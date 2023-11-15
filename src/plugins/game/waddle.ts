import { JSONSchemaType } from 'ajv';
import { GameWorld } from '../../classes/GameWorld';
import { User } from '../../classes/user/User';
import { MyAjv } from '../../managers/AjvManager';
import { IGamePlugin } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IJoinWaddleArgs { waddle: number; }

export default class WaddlePlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Waddle';

	constructor(world: GameWorld)
	{
		super(world);

		this.events = {
			get_waddles: this.getWaddles,
			join_waddle: this.joinWaddle,
			leaveWaddle: this.leaveWaddle,
		};

		this.schemas = {
			joinWaddle: MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['waddle'],
				properties: {
					waddle: { type: 'integer', minimum: 0, maximum: constants.limits.sql.MAX_UNSIGNED_INTEGER },
				},
			} as JSONSchemaType<IJoinWaddleArgs>),
		};
	}

	// eslint-disable-next-line class-methods-use-this
	getWaddles = (args: unknown, user: User) =>
	{
		if (!user.room) return;

		const waddles = Object.fromEntries([...user.room.waddles].map(([waddleId, waddle]) =>
		{
			const users = waddle.users.map((u) => (u ? u.data.username : null));
			return [waddleId, users];
		}));

		user.send('get_waddles', { waddles });
	};

	// eslint-disable-next-line class-methods-use-this
	joinWaddle = (args: IJoinWaddleArgs, user: User) =>
	{
		if (!this.schemas.joinWaddle!(args)) return;

		const waddle = user.room?.waddles.get(args.waddle);
		if (!waddle || waddle.isFull || user.waddle) return;

		waddle.add(user);
	};

	// eslint-disable-next-line class-methods-use-this
	leaveWaddle = (args: unknown, user: User) => user.waddle?.remove(user);
}
