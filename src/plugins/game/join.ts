import { JSONSchemaType } from 'ajv';
import { User } from '../../classes/user';
import { GameWorld } from '../../classes/world';
import { GamePlugin } from '../templates/GamePlugin';

export default class JoinPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Join';
	events: Record<string, (args: TActionMessageArgs, user: User) => void>;
	schemas: Record<string, JSONSchemaType<unknown>>;

	constructor(world: GameWorld)
	{
		super(world);

		this.events = {
			join_server: JoinPlugin.joinServer,
			join_room: JoinPlugin.joinRoom,
		};

		this.schemas = {

		};
	}

	static joinServer = async (args: TActionMessageArgs, user: User) =>
	{
		user.send('load_player', {
			user: user.getSafe(),
			rank: user.dbUser.rank,
			coins: user.dbUser.coins,
			// TODO: finish this
			buddies: [],
			ignores: [],
			inventory: [],
			igloos: [],
			furniture: [],
		});

		// TODO: update login token

		// TODO: get spawn
		user.joinRoom(100);
	};

	// TODO: add ajv
	static joinRoom = (args: TActionMessageArgs, user: User) => user.joinRoom(args.room as number, args.x as number, args.y as number);
}
