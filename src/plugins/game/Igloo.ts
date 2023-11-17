import typia, { tags } from 'typia';
import { Igloo } from '../../classes/room/Igloo';
import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { Config } from '../../managers/ConfigManager';
import { Database } from '../../managers/DatabaseManager';
import { IGamePlugin } from '../../types/types';
import { constants } from '../../utils/constants';
import { getIglooId } from '../../utils/functions';
import { GamePlugin } from '../GamePlugin';

interface IAddIglooOrGetIglooOpenArgs { igloo: number & tags.Type<'uint32'> & tags.Minimum<0> & tags.Maximum<typeof constants.limits.sql.MAX_UNSIGNED_INTEGER>; }
interface IAddFurnitureArgs { furniture: number & tags.Type<'uint32'> & tags.Minimum<0> & tags.Maximum<typeof constants.limits.sql.MAX_UNSIGNED_INTEGER>; }
interface IUpdateIglooArgs { type: number & tags.Type<'uint32'> & tags.Minimum<0> & tags.Maximum<typeof constants.limits.sql.MAX_UNSIGNED_INTEGER>; }
interface IUpdateFlooringArgs { flooring: number & tags.Type<'uint32'> & tags.Minimum<0> & tags.Maximum<typeof constants.limits.sql.MAX_UNSIGNED_INTEGER>; }
interface IUpdateMusicArgs { music: number & tags.Type<'uint32'> & tags.Minimum<0> & tags.Maximum<typeof constants.limits.MAX_MUSIC>; }

interface IUpdateFurnitureArgs
{
	furniture: {
		furnitureId: number & tags.Type<'uint32'> & tags.Minimum<0> & tags.Maximum<typeof constants.limits.sql.MAX_UNSIGNED_INTEGER>;
		x: number & tags.Type<'uint32'> & tags.Minimum<0> & tags.Maximum<typeof constants.limits.sql.MAX_UNSIGNED_SMALLINT>;
		y: number & tags.Type<'uint32'> & tags.Minimum<0> & tags.Maximum<typeof constants.limits.sql.MAX_UNSIGNED_SMALLINT>;
		rotation: number & tags.Type<'uint32'> & tags.Minimum<0> & tags.Maximum<typeof constants.limits.sql.MAX_UNSIGNED_SMALLINT>;
		frame: number & tags.Type<'uint32'> & tags.Minimum<0> & tags.Maximum<typeof constants.limits.sql.MAX_UNSIGNED_SMALLINT>;
	}[];
}

export default class IglooPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Igloo';

	@Event('add_igloo')
	async addIgloo(args: IAddIglooOrGetIglooOpenArgs, user: User)
	{
		if (!typia.equals(args)) return;

		const igloo = user.validatePurchase.igloo(args.igloo);
		if (!igloo) return;

		user.igloos.add(args.igloo);
		await user.updateCoins(-igloo.cost);

		user.send('add_igloo', { igloo: args.igloo, coins: user.data.coins });
	}

	@Event('add_furniture')
	async addFurniture(args: IAddFurnitureArgs, user: User)
	{
		if (!typia.equals(args)) return;

		const furniture = user.validatePurchase.furniture(args.furniture);
		if (!furniture) return;

		if (!user.furniture.add(args.furniture)) return;

		await user.updateCoins(-furniture.cost);
		user.send('add_furniture', { furniture: args.furniture, coins: user.data.coins });
	}

	@Event('update_igloo')
	async updateIgloo(args: IUpdateIglooArgs, user: User)
	{
		if (!typia.equals(args)) return;

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
	}

	@Event('update_furniture')
	async updateFurniture(args: IUpdateFurnitureArgs, user: User)
	{
		if (!typia.equals(args)) return;

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
	}

	@Event('update_flooring')
	async updateFlooring(args: IUpdateFlooringArgs, user: User)
	{
		if (!typia.equals(args)) return;

		const igloo = this.getIgloo(user.data.id);
		if (igloo === undefined || igloo !== user.room || igloo.dbData.flooring === args.flooring) return;

		const flooring = user.validatePurchase.flooring(args.flooring);
		if (!flooring) return;

		await igloo.dbUpdate({ flooring: args.flooring });
		igloo.dbData.flooring = args.flooring;

		await user.updateCoins(-flooring.cost);

		user.send('update_flooring', { flooring: args.flooring, coins: user.data.coins });
		if (Config.data.game.fixSync) user.room.send(user, 'update_flooring', { flooring: args.flooring });
	}

	@Event('update_music')
	async updateMusic(args: IUpdateMusicArgs, user: User)
	{
		if (!typia.equals(args)) return;

		const igloo = this.getIgloo(user.data.id);
		if (igloo === undefined || igloo !== user.room || igloo.dbData.music === args.music) return;

		await igloo.dbUpdate({ music: args.music });
		igloo.dbData.music = args.music;

		if (!Config.data.game.fixSync)
		{
			user.send('update_music', { music: args.music });
		}
		else user.room.send(user, 'update_music', { music: args.music }, []);
	}

	@Event('open_igloo')
	openIgloo(args: unknown, user: User)
	{
		const igloo = this.getIgloo(user.data.id);
		if (igloo === undefined || igloo !== user.room) return;

		igloo.locked = false;
	}

	@Event('close_igloo')
	closeIgloo(args: unknown, user: User)
	{
		const igloo = this.getIgloo(user.data.id);
		if (igloo === undefined || igloo !== user.room) return;

		igloo.locked = true;
	}

	@Event('get_igloos')
	getIgloos(args: unknown, user: User)
	{
		user.send('get_igloos', {
			igloos: [...this.world.rooms.values()]
				.filter((x) => x.isIgloo && !(x as Igloo).locked)
				.map((x) => ({
					id: (x as Igloo).dbData.userId,
					username: (x as Igloo).ownerUsername,
				})),
		});
	}

	@Event('get_igloo_open')
	getIglooOpen(args: IAddIglooOrGetIglooOpenArgs, user: User)
	{
		if (!typia.equals(args)) return;

		const igloo = this.getIgloo(user.data.id);
		if (igloo === undefined || igloo.locked)
		{
			user.send('get_igloo_open', { open: false });
			return;
		}

		user.send('get_igloo_open', { open: true });
	}

	getIgloo(userId: number)
	{
		return this.world.rooms.get(getIglooId(userId)) as Igloo | undefined;
	}
}
