import type { User } from '../../classes/user/User';
import type IglooPlugin from '../../plugins/game/Igloo';
import type { IGameCommand } from '../../types/types';
import { GameCommand } from '../GameCommand';

export default class Command extends GameCommand implements IGameCommand
{
	name = 'af';
	override rank = 1;

	override onCall(args: string[], user: User): void
	{
		const furniture = Number(args[0]);
		if (Number.isNaN(furniture)) return;

		const plugin = this.world.pluginManager.items.get('Igloo');
		if (plugin === undefined) return;

		(plugin as IglooPlugin).addFurniture({ furniture }, user);
	}
}
