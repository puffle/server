import { JSONSchemaType, ValidateFunction } from 'ajv';
import { GameWorld } from '../../classes/GameWorld';
import { User } from '../../classes/User';
import { MyAjv } from '../../managers/AjvManager';
import { Config } from '../../managers/ConfigManager';
import { IGamePlugin } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IJoinRoomArgs { room: number; x: number; y: number; }
interface IJoinIglooArgs { igloo: number; x: number; y: number; }

export default class JoinPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Join';

	constructor(world: GameWorld)
	{
		super(world);

		this.events = {
			join_server: this.joinServer,
			join_room: this.joinRoom,
			join_igloo: this.joinIgloo,
		};

		this.schemas = new Map<string, ValidateFunction<unknown>>([
			['joinRoom', MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['room', 'x', 'y'],
				properties: {
					room: { type: 'integer', minimum: 0, maximum: constants.limits.sql.MAX_UNSIGNED_INTEGER },
					x: { type: 'integer', minimum: 0, maximum: constants.limits.MAX_X },
					y: { type: 'integer', minimum: 0, maximum: constants.limits.MAX_Y },
				},
			} as JSONSchemaType<IJoinRoomArgs>)],

			['joinIgloo', MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['igloo', 'x', 'y'],
				properties: {
					igloo: { type: 'integer', minimum: 0, maximum: constants.limits.sql.MAX_UNSIGNED_INTEGER },
					x: { type: 'integer', minimum: 0, maximum: constants.limits.MAX_X },
					y: { type: 'integer', minimum: 0, maximum: constants.limits.MAX_Y },
				},
			} as JSONSchemaType<IJoinIglooArgs>)],
		]);
	}

	joinServer = (args: unknown, user: User) =>
	{
		user.send('load_player', {
			user: user.getSafe,
			rank: user.data.rank,
			coins: user.data.coins,
			// TODO: finish this
			buddies: [],
			ignores: [],
			inventory: user.inventory,
			igloos: user.igloos,
			furniture: user.furniture,
		});

		// TODO: update login token
		const spawn = this.getSpawn();
		if (spawn === undefined) return;

		// sending the coordinates (x, y) = (0, 0) does not synchronize the player,
		// causing him to be seen in a different position from where the other players see him.
		// this is not a bug, but the normal operation in AS2.
		user.joinRoom(spawn);
	};

	joinRoom = (args: IJoinRoomArgs, user: User) => this.schemas.get('joinRoom')!(args) && user.joinRoom(args.room, args.x, args.y);
	joinIgloo = (args: IJoinIglooArgs, user: User) => this.schemas.get('joinIgloo')!(args) && user.joinIgloo(args.igloo, args.x, args.y);

	private getSpawn = () =>
	{
		const preferredSpawn = Config.data.game.preferredSpawn;

		if (preferredSpawn !== 0)
		{
			const room = this.world.rooms.get(preferredSpawn);
			if (room !== undefined && !room.isFull && !room.isIgloo) return room.data.id;
		}

		const roomsArr = [...this.world.rooms];
		let spawns = roomsArr.filter((room) => room[1].data.spawn && !room[1].isFull && !room[1].isIgloo);
		if (!spawns.length) spawns = roomsArr.filter((room) => !room[1].data.game && !room[1].isFull && !room[1].isIgloo);

		return spawns[Math.floor(Math.random() * spawns.length)]?.[0];
	};
}
