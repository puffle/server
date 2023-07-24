import { JSONSchemaType, ValidateFunction } from 'ajv';
import { GameWorld } from '../../classes/GameWorld';
import { User } from '../../classes/User';
import { MyAjv } from '../../managers/AjvManager';
import { Database } from '../../managers/DatabaseManager';
import { IGamePlugin } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IGetPlayerArgs { id: number; }

export default class GetPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Get';

	constructor(world: GameWorld)
	{
		super(world);

		this.events = {
			get_player: this.getPlayer,
		};

		this.schemas = new Map<string, ValidateFunction<unknown>>([
			['getPlayer', MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['id'],
				properties: {
					id: { type: 'integer', minimum: 0, maximum: constants.limits.sql.MAX_UNSIGNED_INTEGER },
				},
			} as JSONSchemaType<IGetPlayerArgs>)],
		]);
	}

	getPlayer = async (args: IGetPlayerArgs, user: User) =>
	{
		if (!this.schemas.get('getPlayer')!(args)) return;
		// if (user.data.id === args.id) return;

		const requestedUser = this.world.users.get(args.id);
		if (requestedUser !== undefined)
		{
			user.send('get_player', { penguin: requestedUser.getAnonymous });
			return;
		}

		if (user.buddies.data.get(args.id) === undefined) return;

		const anonUser = await Database.findAnonymousUser(args.id);
		user.send('get_player', { penguin: anonUser });
	};
}
