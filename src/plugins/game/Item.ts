import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { IGamePlugin, IntNumberRange, TItemSlots, Validate } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IUpdatePlayerOrAddItemArgs { item: number & IntNumberRange<[1, typeof constants.limits.sql.MAX_UNSIGNED_INTEGER]>; }
interface IRemoveItemArgs { type: TItemSlots; }

export default class ItemPlugin extends GamePlugin implements IGamePlugin
{
	name = 'Item';

	@Event('update_player')
	updatePlayer(args: Validate<IUpdatePlayerOrAddItemArgs>, user: User)
	{
		const item = this.world.crumbs.items[args.item];
		if (item === undefined || !user.inventory.has(args.item)) return;

		user.setItem(constants.ITEM_SLOTS[item.type - 1], args.item);
	}

	@Event('remove_item')
	removeItem(args: Validate<IRemoveItemArgs>, user: User)
	{
		user.setItem(args.type, 0);
	}

	@Event('add_item')
	async addItem(args: Validate<IUpdatePlayerOrAddItemArgs>, user: User)
	{
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
