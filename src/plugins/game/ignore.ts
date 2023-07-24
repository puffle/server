import { JSONSchemaType, ValidateFunction } from 'ajv';
import { GameWorld } from '../../classes/GameWorld';
import { User } from '../../classes/User';
import { MyAjv } from '../../managers/AjvManager';
import { Database } from '../../managers/DatabaseManager';
import { IGamePlugin } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IGenericIgnoreArgs { id: number; }

export default class IgnorePlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Ignore';

	constructor(world: GameWorld)
	{
		super(world);

		this.events = {
			ignore_add: this.ignoreAdd,
			ignore_remove: this.ignoreRemove,
		};

		this.schemas = new Map<string, ValidateFunction<unknown>>([
			['genericIgnoreId', MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['id'],
				properties: {
					id: { type: 'integer', minimum: 0, maximum: constants.limits.MAX_X },
				},
			} as JSONSchemaType<IGenericIgnoreArgs>)],
		]);
	}

	ignoreAdd = async (args: IGenericIgnoreArgs, user: User) =>
	{
		if (!this.schemas.get('genericIgnoreId')!(args)) return;

		if (
			args.id === user.data.id
			|| user.buddies.data.has(args.id)
			|| user.ignores.data.has(args.id)
		) return;

		const ignore = this.world.users.get(args.id);
		let username: string | undefined;

		if (ignore !== undefined) // user to ignore is online
		{
			username = ignore.data.username;
			ignore.buddies.deleteRequest(user.data.id);
		}
		else // user to ignore is offline
		{
			username = await Database.getUsername(args.id);
		}

		if (username === undefined) return;

		user.buddies.deleteRequest(args.id);
		user.ignores.addIgnore(args.id, username);
	};

	ignoreRemove = (args: IGenericIgnoreArgs, user: User) =>
	{
		if (!this.schemas.get('genericIgnoreId')!(args)) return;

		if (!user.ignores.data.has(args.id)) return;

		user.ignores.removeIgnore(args.id);
	};
}