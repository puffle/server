import { JSONSchemaType, ValidateFunction } from 'ajv';
import { GameWorld } from '../../classes/GameWorld';
import { User } from '../../classes/User';
import { MyAjv } from '../../managers/AjvManager';
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

	joinRoom = (args: IJoinRoomArgs, user: User) => this.schemas.get('joinRoom')!(args) && user.joinRoom(args.room, args.x, args.y);
	joinIgloo = (args: IJoinIglooArgs, user: User) => this.schemas.get('joinIgloo')!(args) && user.joinIgloo(args.igloo, args.x, args.y);
}
