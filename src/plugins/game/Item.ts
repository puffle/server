import { JSONSchemaType, ValidateFunction } from 'ajv';
import { GameWorld } from '../../classes/GameWorld';
import { User } from '../../classes/User';
import { MyAjv } from '../../managers/AjvManager';
import { IGamePlugin } from '../../types/types';
import { EItemSlots } from '../../utils/enums';
import { GamePlugin } from '../GamePlugin';

interface IUpdatePlayerOrAddItemArgs { item: number; }
interface IRemoveItemArgs { type: keyof typeof EItemSlots; }

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

		this.schemas = new Map<string, ValidateFunction<unknown>>([
			['updatePlayerOrAddItem', MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['item'],
				properties: {
					item: { type: 'integer', minimum: 1 },
				},
			} as JSONSchemaType<IUpdatePlayerOrAddItemArgs>)],

			['removeItem', MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['type'],
				properties: {
					type: { type: 'string', enum: Object.keys(EItemSlots).filter((key) => Number.isNaN(Number(key))) },
				},
			} as JSONSchemaType<IRemoveItemArgs>)],
		]);
	}

	updatePlayer = (args: IUpdatePlayerOrAddItemArgs, user: User) =>
	{
		if (!this.schemas.get('updatePlayerOrAddItem')!(args)) return;

		const item = this.world.crumbs.items[args.item];
		if (item === undefined || !user.inventory.items.includes(args.item)) return;

		user.setItem(item.type - 1, args.item);
	};

	removeItem = (args: IRemoveItemArgs, user: User) =>
	{
		if (!this.schemas.get('removeItem')!(args)) return;

		user.setItem(EItemSlots[args.type], 0);
	};

	addItem = async (args: IUpdatePlayerOrAddItemArgs, user: User) =>
	{
		if (!this.schemas.get('updatePlayerOrAddItem')!(args)) return;

		const item = user.validatePurchase.item(args.item);
		if (!item || user.inventory.items.includes(args.item)) return;

		const slot = EItemSlots[item.type - 1];
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
