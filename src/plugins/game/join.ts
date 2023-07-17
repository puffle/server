import { JSONSchemaType, ValidateFunction } from 'ajv';
import { User } from '../../classes/user';
import { GameWorld } from '../../classes/world';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../templates/GamePlugin';

interface IJoinRoomArgs { room: number; x: number; y: number; }

export default class JoinPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Join';

	constructor(world: GameWorld)
	{
		super(world);

		this.events = {
			join_server: JoinPlugin.joinServer,
			join_room: this.joinRoom,
		};

		this.schemas = new Map<string, ValidateFunction<unknown>>([
			['joinRoom', this.world.ajv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['room', 'x', 'y'],
				properties: {
					room: { type: 'integer', minimum: 0 },
					x: { type: 'integer', minimum: 0, maximum: constants.limits.MAX_X },
					y: { type: 'integer', minimum: 0, maximum: constants.limits.MAX_Y },
				},
			} as JSONSchemaType<IJoinRoomArgs>)],
		]);
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

	joinRoom = (args: IJoinRoomArgs, user: User) => this.schemas.get('joinRoom')!(args) && user.joinRoom(args.room as number, args.x as number, args.y as number);
}
