import { JSONSchemaType } from 'ajv';
import { GameWorld } from '../../classes/GameWorld';
import { Igloo } from '../../classes/room/Igloo';
import { User } from '../../classes/user/User';
import { MyAjv } from '../../managers/AjvManager';
import { Config } from '../../managers/ConfigManager';
import { Database } from '../../managers/DatabaseManager';
import { IGamePlugin } from '../../types/types';
import { constants } from '../../utils/constants';
import { getIglooId } from '../../utils/functions';
import { GamePlugin } from '../GamePlugin';

interface IAddIglooOrGetIglooOpenArgs { igloo: number; }
interface IAddFurnitureArgs { furniture: number; }
interface IUpdateIglooArgs { type: number; }
interface IUpdateFlooringArgs { flooring: number; }
interface IUpdateMusicArgs { music: number; }

interface IUpdateFurnitureArgs
{
	furniture: {
		furnitureId: number;
		x: number;
		y: number;
		rotation: number;
		frame: number;
	}[];
}

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
			update_furniture: this.updateFurniture,
			update_flooring: this.updateFlooring,
			update_music: this.updateMusic,

			open_igloo: this.openIgloo,
			close_igloo: this.closeIgloo,

			get_igloos: this.getIgloos,
			get_igloo_open: this.getIglooOpen,
		};

		this.schemas = {
			addIglooOrGetIglooOpen: MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['igloo'],
				properties: {
					igloo: { type: 'integer', minimum: 0, maximum: constants.limits.sql.MAX_UNSIGNED_INTEGER },
				},
			} as JSONSchemaType<IAddIglooOrGetIglooOpenArgs>),

			addFurniture: MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['furniture'],
				properties: {
					furniture: { type: 'integer', minimum: 0, maximum: constants.limits.sql.MAX_UNSIGNED_INTEGER },
				},
			} as JSONSchemaType<IAddFurnitureArgs>),

			updateIgloo: MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['type'],
				properties: {
					type: { type: 'integer', minimum: 0, maximum: constants.limits.sql.MAX_UNSIGNED_INTEGER },
				},
			} as JSONSchemaType<IUpdateIglooArgs>),

			updateFurniture: MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['furniture'],
				properties: {
					furniture: {
						type: 'array',
						items: {
							type: 'object',
							additionalProperties: false,
							required: ['furnitureId', 'x', 'y', 'rotation', 'frame'],
							properties: {
								furnitureId: { type: 'integer', minimum: 0, maximum: constants.limits.sql.MAX_UNSIGNED_INTEGER },
								x: { type: 'integer', minimum: 0, maximum: constants.limits.sql.MAX_UNSIGNED_SMALLINT },
								y: { type: 'integer', minimum: 0, maximum: constants.limits.sql.MAX_UNSIGNED_SMALLINT },
								rotation: { type: 'integer', minimum: 0, maximum: constants.limits.sql.MAX_UNSIGNED_SMALLINT },
								frame: { type: 'integer', minimum: 0, maximum: constants.limits.sql.MAX_UNSIGNED_SMALLINT },
							},
						},
					},
				},
			} as JSONSchemaType<IUpdateFurnitureArgs>),

			updateFlooring: MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['flooring'],
				properties: {
					flooring: { type: 'integer', minimum: 0, maximum: constants.limits.sql.MAX_UNSIGNED_INTEGER },
				},
			} as JSONSchemaType<IUpdateFlooringArgs>),

			updateMusic: MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['music'],
				properties: {
					music: { type: 'integer', minimum: 0, maximum: constants.limits.MAX_MUSIC },
				},
			} as JSONSchemaType<IUpdateMusicArgs>),
		};
	}

	addIgloo = async (args: IAddIglooOrGetIglooOpenArgs, user: User) =>
	{
		if (!this.schemas.addIglooOrGetIglooOpen!(args)) return;

		const igloo = user.validatePurchase.igloo(args.igloo);
		if (!igloo) return;

		user.igloos.add(args.igloo);
		await user.updateCoins(-igloo.cost);

		user.send('add_igloo', { igloo: args.igloo, coins: user.data.coins });
	};

	addFurniture = async (args: IAddFurnitureArgs, user: User) =>
	{
		if (!this.schemas.addFurniture!(args)) return;

		const furniture = user.validatePurchase.furniture(args.furniture);
		if (!furniture) return;

		if (!user.furniture.add(args.furniture)) return;

		await user.updateCoins(-furniture.cost);
		user.send('add_furniture', { furniture: args.furniture, coins: user.data.coins });
	};

	updateIgloo = async (args: IUpdateIglooArgs, user: User) =>
	{
		if (!this.schemas.updateIgloo!(args)) return;

		const igloo = this.getIgloo(user.data.id);
		if (igloo === undefined || igloo !== user.room || igloo.dbData.type === args.type) return;

		if (!user.igloos.has(args.type)) return;

		// ? TODO: use Promise.all()
		await igloo.clearFurniture();
		await igloo.dbUpdate({ type: args.type, flooring: 0 });

		igloo.dbData.type = args.type;
		igloo.dbData.flooring = 0;

		// TODO: add fixSync (to desync this)
		// join_igloo is not being used on AS2, a custom event was used to update the igloo
		igloo.refresh(user);
	};

	updateFurniture = async (args: IUpdateFurnitureArgs, user: User) =>
	{
		if (!this.schemas.updateFurniture!(args)) return;

		const igloo = this.getIgloo(user.data.id);
		if (igloo === undefined || igloo !== user.room) return;

		await igloo.clearFurniture();

		const quantities: Record<number, number> = {};

		args.furniture.forEach((item) =>
		{
			const id = item.furnitureId;
			if (!item || !user.furniture.has(id)) return;

			// update quantity
			quantities[id] = (quantities[id] !== undefined) ? (quantities[id]! + 1) : 1;

			// validate quantity
			if (quantities[id]! > user.furniture.getQuantity(id)) return;

			igloo.furniture.push({ ...item, userId: user.data.id });
		});

		await Database.furniture.createMany({ data: igloo.furniture });

		// TODO: add a custom event to update furniture without rejoin
		if (Config.data.game.fixSync) igloo.refresh(user);
	};

	updateFlooring = async (args: IUpdateFlooringArgs, user: User) =>
	{
		if (!this.schemas.updateFlooring!(args)) return;

		const igloo = this.getIgloo(user.data.id);
		if (igloo === undefined || igloo !== user.room || igloo.dbData.flooring === args.flooring) return;

		const flooring = user.validatePurchase.flooring(args.flooring);
		if (!flooring) return;

		await igloo.dbUpdate({ flooring: args.flooring });
		igloo.dbData.flooring = args.flooring;

		await user.updateCoins(-flooring.cost);

		user.send('update_flooring', { flooring: args.flooring, coins: user.data.coins });
		if (Config.data.game.fixSync) user.room.send(user, 'update_flooring', { flooring: args.flooring });
	};

	updateMusic = async (args: IUpdateMusicArgs, user: User) =>
	{
		if (!this.schemas.updateMusic!(args)) return;

		const igloo = this.getIgloo(user.data.id);
		if (igloo === undefined || igloo !== user.room || igloo.dbData.music === args.music) return;

		await igloo.dbUpdate({ music: args.music });
		igloo.dbData.music = args.music;

		if (!Config.data.game.fixSync)
		{
			user.send('update_music', { music: args.music });
		}
		else user.room.send(user, 'update_music', { music: args.music }, []);
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
		if (!this.schemas.addIglooOrGetIglooOpen!(args)) return;

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
