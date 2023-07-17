import { JSONSchemaType, ValidateFunction } from 'ajv';
import { User } from '../../classes/user';
import { GameWorld } from '../../classes/world';
import { MyAjv } from '../../managers/AjvManager';
import { Database } from '../../managers/DatabaseManager';
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
					id: { type: 'integer', minimum: 0 },
				},
			} as JSONSchemaType<IGetPlayerArgs>)],
		]);
	}

	getPlayer = async (args: IGetPlayerArgs, user: User) =>
	{
		if (!this.schemas.get('getPlayer')!(args)) return;

		const requestedUser = this.world.users.get(args.id);
		if (requestedUser !== undefined)
		{
			user.send('get_player', { penguin: requestedUser.getAnonymous });
			return;
		}

		// TODO: add buddy check

		const anonUser = await Database.findAnonymousUser(args.id);
		user.send('get_player', { penguin: anonUser });
	};
}
