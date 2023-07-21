import { JSONSchemaType, ValidateFunction } from 'ajv';
import { GameWorld } from '../../classes/GameWorld';
import { User } from '../../classes/User';
import { MyAjv } from '../../managers/AjvManager';
import { Config } from '../../managers/ConfigManager';
import { IGamePlugin, TActionMessageArgs } from '../../types';
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
			['joinRoom', MyAjv.compile({
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

	joinServer = (args: TActionMessageArgs, user: User) =>
	{
		user.send('load_player', {
			user: user.getSafe,
			rank: user.data.rank,
			coins: user.data.coins,
			// TODO: finish this
			buddies: [],
			ignores: [],
			inventory: user.inventory.items,
			igloos: user.igloos.data,
			furniture: [],
		});

		// TODO: update login token
		const spawn = this.getSpawn();
		if (spawn === undefined) return;

		user.joinRoom(spawn);
	};

	joinRoom = (args: IJoinRoomArgs, user: User) => this.schemas.get('joinRoom')!(args) && user.joinRoom(args.room, args.x, args.y);

	private getSpawn = () =>
	{
		const preferredSpawn = Config.data.game.preferredSpawn;

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
