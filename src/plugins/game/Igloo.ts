import { JSONSchemaType, ValidateFunction } from 'ajv';
import { GameWorld } from '../../classes/GameWorld';
import { User } from '../../classes/User';
import { Igloo } from '../../classes/room/Igloo';
import { MyAjv } from '../../managers/AjvManager';
import { IGamePlugin } from '../../types/types';
import { constants } from '../../utils/constants';
import { getIglooId } from '../../utils/functions';
import { GamePlugin } from '../GamePlugin';

interface IAddIglooOrGetIglooOpenArgs { igloo: number; }
interface IAddFurnitureArgs { furniture: number; }
interface IUpdateIglooArgs { type: number; }
interface IUpdateMusicArgs { music: number; }

export default class IglooPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Igloo';

	constructor(world: GameWorld)
	{
		super(world);

		this.events = {
			add_igloo: this.addIgloo,
			add_furniture: this.addFurniture,

			update_igloo: this.updateIgloo,
			update_music: this.updateMusic,

			open_igloo: this.openIgloo,
			close_igloo: this.closeIgloo,

			get_igloos: this.getIgloos,
			get_igloo_open: this.getIglooOpen,
		};

		this.schemas = new Map<string, ValidateFunction<unknown>>([
			['addIglooOrGetIglooOpen', MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['igloo'],
				properties: {
					igloo: { type: 'integer', minimum: 0 },
				},
			} as JSONSchemaType<IAddIglooOrGetIglooOpenArgs>)],

			['addFurniture', MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['furniture'],
				properties: {
					furniture: { type: 'integer', minimum: 0 },
				},
			} as JSONSchemaType<IAddFurnitureArgs>)],

			['updateIgloo', MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['type'],
				properties: {
					type: { type: 'integer', minimum: 0 },
				},
			} as JSONSchemaType<IUpdateIglooArgs>)],

			['updateMusic', MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['music'],
				properties: {
					music: { type: 'integer', minimum: 0, maximum: constants.limits.MAX_MUSIC },
				},
			} as JSONSchemaType<IUpdateMusicArgs>)],
		]);
	}

	addIgloo = async (args: IAddIglooOrGetIglooOpenArgs, user: User) =>
	{
		if (!this.schemas.get('addIglooOrGetIglooOpen')!(args)) return;

		const igloo = user.validatePurchase.igloo(args.igloo);
		if (!igloo) return;

		user.igloos.add(args.igloo);
		await user.updateCoins(-igloo.cost);

		user.send('add_igloo', { igloo: args.igloo, coins: user.data.coins });
	};

	addFurniture = async (args: IAddFurnitureArgs, user: User) =>
	{
		if (!this.schemas.get('addFurniture')!(args)) return;

		const furniture = user.validatePurchase.furniture(args.furniture);
		if (!furniture) return;

		if (!user.furniture.add(args.furniture)) return;

		await user.updateCoins(-furniture.cost);
		user.send('add_furniture', { furniture: args.furniture, coins: user.data.coins });
	};

	updateIgloo = async (args: IUpdateIglooArgs, user: User) =>
	{
		if (!this.schemas.get('updateIgloo')!(args)) return;

		const igloo = this.getIgloo(user.data.id);
		if (igloo === undefined || igloo !== user.room || igloo.dbData.type === args.type) return;

		if (!user.igloos.data.includes(args.type)) return;

		// TODO: use Promise.all()
		await igloo.clearFurniture();
		await igloo.dbUpdate({ type: args.type, flooring: 0 });

		igloo.dbData.type = args.type;
		igloo.dbData.flooring = 0;

		// TODO: desync this
		// on AS2, the igloo was updated only for the igloo owner, and no one else.
		// however, the owner "does not re-enter the igloo" (join_igloo), but the igloo is updated with a loading screen.
		// new event is required to handle this
		igloo.refresh(user);
	};

	updateMusic = async (args: IUpdateMusicArgs, user: User) =>
	{
		if (!this.schemas.get('updateMusic')!(args)) return;

		const igloo = this.getIgloo(user.data.id);
		if (igloo === undefined || igloo !== user.room || igloo.dbData.music === args.music) return;

		await igloo.dbUpdate({ music: args.music });
		igloo.dbData.music = args.music;

		user.send('update_music', { music: args.music }); // not synced, see below

		// on AS2, igloo's updated music is not being sent to all other penguins in the igloo,
		// they must rejoin to listen the new music.
		// user.sendRoom('update_music', { music: args.music }, []);
	};

	openIgloo = (args: unknown, user: User) =>
	{
		const igloo = this.getIgloo(user.data.id);
		if (igloo === undefined || igloo !== user.room) return;

		igloo.locked = false;
	};

	closeIgloo = (args: unknown, user: User) =>
	{
		const igloo = this.getIgloo(user.data.id);
		if (igloo === undefined || igloo !== user.room) return;

		igloo.locked = true;
	};

	getIgloos = (args: unknown, user: User) => user.send('get_igloos', {
		igloos: [...this.world.rooms.values()]
			.filter((x) => x.isIgloo && !(x as Igloo).locked)
			.map((x) => ({
				id: (x as Igloo).dbData.userId,
				username: (x as Igloo).ownerUsername,
			})),
	});

	getIglooOpen = (args: IAddIglooOrGetIglooOpenArgs, user: User) =>
	{
		if (!this.schemas.get('addIglooOrGetIglooOpen')!(args)) return;

		const igloo = this.getIgloo(user.data.id);
		if (igloo === undefined || igloo.locked)
		{
			user.send('get_igloo_open', { open: false });
			return;
		}

		user.send('get_igloo_open', { open: true });
	};

	getIgloo = (userId: number) => this.world.rooms.get(getIglooId(userId)) as Igloo | undefined;
}
