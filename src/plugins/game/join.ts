import { JSONSchemaType, ValidateFunction } from 'ajv';
import { User } from '../../classes/user';
import { GameWorld } from '../../classes/world';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IJoinRoomArgs { room: number; x: number; y: number; }

export default class JoinPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Join';

	constructor(world: GameWorld)
	{
		super(world);

		this.events = {
			join_server: this.joinServer,
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

	joinServer = async (args: TActionMessageArgs, user: User) =>
	{
		user.send('load_player', {
			user: user.getSafe,
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
		const spawn = this.getSpawn();
		if (spawn === undefined) return;

		user.joinRoom(spawn);
	};

	joinRoom = (args: IJoinRoomArgs, user: User) => this.schemas.get('joinRoom')!(args) && user.joinRoom(args.room as number, args.x as number, args.y as number);

	private getSpawn = () =>
	{
		const preferredSpawn = this.world.config.data.game.preferredSpawn;

		if (preferredSpawn !== 0)
		{
			const room = this.world.rooms.get(preferredSpawn);
			if (room !== undefined && !room.isFull) return room.data.id;
		}

		const roomsArr = [...this.world.rooms];
		let spawns = roomsArr.filter((room) => room[1].data.spawn && !room[1].isFull);
		if (!spawns.length) spawns = roomsArr.filter((room) => !room[1].data.game && !room[1].isFull);

		return spawns[Math.floor(Math.random() * spawns.length)]?.[0];
	};
}
