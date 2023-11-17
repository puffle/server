import { JSONSchemaType } from 'ajv';
import typia, { tags } from 'typia';
import { GameWorld } from '../../classes/GameWorld';
import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { MyAjv } from '../../managers/AjvManager';
import { IGamePlugin, TItemSlots } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IUpdatePlayerOrAddItemArgs { item: number & tags.Type<'uint32'> & tags.Minimum<1> & tags.Maximum<typeof constants.limits.sql.MAX_UNSIGNED_INTEGER>; }
interface IRemoveItemArgs { type: TItemSlots; }

export default class ItemPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Item';

	constructor(world: GameWorld)
	{
		super(world);

		this.schemas = {
			removeItem: MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['type'],
				properties: {
					type: { type: 'string', enum: constants.ITEM_SLOTS },
				},
			} as JSONSchemaType<IRemoveItemArgs>),
		};
	}

	@Event('update_player')
	updatePlayer(args: IUpdatePlayerOrAddItemArgs, user: User)
	{
		if (!typia.equals(args)) return;

		const item = this.world.crumbs.items[args.item];
		if (item === undefined || !user.inventory.has(args.item)) return;

		user.setItem(constants.ITEM_SLOTS[item.type - 1], args.item);
	}

	@Event('remove_item')
	removeItem(args: IRemoveItemArgs, user: User)
	{
		if (!this.schemas.removeItem!(args)) return;

		user.setItem(args.type, 0);
	}

	@Event('add_item')
	async addItem(args: IUpdatePlayerOrAddItemArgs, user: User)
	{
		if (!typia.equals(args)) return;

		const item = user.validatePurchase.item(args.item);
		if (!item || user.inventory.has(args.item)) return;

		const slot = constants.ITEM_SLOTS[item.type - 1];
		if (slot === undefined) return;

		user.inventory.add(args.item);
		await user.updateCoins(-item.cost);

		user.send('add_item', {
			item: args.item,
			name: item.name,
			slot,
			coins: user.data.coins,
		});
	}
}
