import { JSONSchemaType, ValidateFunction } from 'ajv';
import { GameWorld } from '../../classes/GameWorld';
import { User } from '../../classes/User';
import { Igloo } from '../../classes/room/Igloo';
import { MyAjv } from '../../managers/AjvManager';
import { IGamePlugin } from '../../types/types';
import { getIglooId } from '../../utils/functions';
import { GamePlugin } from '../GamePlugin';

interface IGetIglooOpen { igloo: number; }

export default class IglooPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Igloo';

	constructor(world: GameWorld)
	{
		super(world);

		this.events = {
			open_igloo: this.openIgloo,
			close_igloo: this.closeIgloo,

			get_igloos: this.getIgloos,
			get_igloo_open: this.getIglooOpen,
		};

		this.schemas = new Map<string, ValidateFunction<unknown>>([
			['getIglooOpen', MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['igloo'],
				properties: {
					igloo: { type: 'integer', minimum: 0 },
				},
			} as JSONSchemaType<IGetIglooOpen>)],
		]);
	}

	openIgloo = (args: unknown, user: User) =>
	{
		const igloo = this.world.rooms.get(getIglooId(user.data.id));
		if (igloo === undefined || !igloo.isIgloo || igloo !== user.room) return;

		(igloo as Igloo).locked = false;
	};

	closeIgloo = (args: unknown, user: User) =>
	{
		const igloo = this.world.rooms.get(getIglooId(user.data.id));
		if (igloo === undefined || !igloo.isIgloo || igloo !== user.room) return;

		(igloo as Igloo).locked = true;
	};

	getIgloos = (args: unknown, user: User) => user.send('get_igloos', {
		igloos: [...this.world.rooms.values()]
			.filter((x) => x.isIgloo && !(x as Igloo).locked)
			.map((x) => ({
				id: (x as Igloo).dbData.userId,
				username: (x as Igloo).ownerUsername,
			})),
	});

	getIglooOpen = (args: IGetIglooOpen, user: User) =>
	{
		if (!this.schemas.get('getIglooOpen')!(args)) return;

		const igloo = this.world.rooms.get(getIglooId(user.data.id));
		if (igloo === undefined || !igloo.isIgloo || (igloo as Igloo).locked)
		{
			user.send('get_igloo_open', { open: false });
			return;
		}

		user.send('get_igloo_open', { open: true });
	};
}
