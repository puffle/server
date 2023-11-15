import { JSONSchemaType } from 'ajv';
import { GameWorld } from '../../classes/GameWorld';
import { User } from '../../classes/user/User';
import { MyAjv } from '../../managers/AjvManager';
import { IGamePlugin, TItemSlots } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IUpdatePlayerOrAddItemArgs { item: number; }
interface IRemoveItemArgs { type: TItemSlots; }

export default class ItemPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Item';

	constructor(world: GameWorld)
	{
		super(world);

		this.events = {
			update_player: this.updatePlayer,
			remove_item: this.removeItem,
			add_item: this.addItem,
		};

		this.schemas = {
			updatePlayerOrAddItem: MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['item'],
				properties: {
					item: { type: 'integer', minimum: 1, maximum: constants.limits.sql.MAX_UNSIGNED_INTEGER },
				},
			} as JSONSchemaType<IUpdatePlayerOrAddItemArgs>),

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

	updatePlayer = (args: IUpdatePlayerOrAddItemArgs, user: User) =>
	{
		if (!this.schemas.updatePlayerOrAddItem!(args)) return;

		const item = this.world.crumbs.items[args.item];
		if (item === undefined || !user.inventory.has(args.item)) return;

		user.setItem(constants.ITEM_SLOTS[item.type - 1], args.item);
	};

	removeItem = (args: IRemoveItemArgs, user: User) =>
	{
		if (!this.schemas.removeItem!(args)) return;

		user.setItem(args.type, 0);
	};

	addItem = async (args: IUpdatePlayerOrAddItemArgs, user: User) =>
	{
		if (!this.schemas.updatePlayerOrAddItem!(args)) return;

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
	};
}
