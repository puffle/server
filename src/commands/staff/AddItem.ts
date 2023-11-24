import type { User } from '../../classes/user/User';
import type ItemPlugin from '../../plugins/game/Item';
import type { IGameCommand } from '../../types/types';
import { GameCommand } from '../GameCommand';

export default class Command extends GameCommand implements IGameCommand
{
	name = 'ai';
	override rank = 1;

	override onCall(args: string[], user: User): void
	{
		const item = Number(args[0]);
		if (Number.isNaN(item)) return;

		const plugin = this.world.pluginManager.items.get('Item');
		if (plugin === undefined) return;

		(plugin as ItemPlugin).addItem({ item }, user);
	}
}
