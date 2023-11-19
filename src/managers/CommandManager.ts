import { join } from 'node:path';
import { GameWorld } from '../classes/GameWorld';
import { User } from '../classes/user/User';
import { IGameCommand } from '../types/types';
import { Loadable } from '../utils/Loadable';
import { constants } from '../utils/constants';

export class CommandManager extends Loadable<IGameCommand>
{
	type = 'Command';

	constructor(world: GameWorld)
	{
		super(world, join(__dirname, '..', 'commands'));
	}

	// eslint-disable-next-line class-methods-use-this
	loadAdditional() { }

	processCommand = (message: string, user: User) =>
	{
		const [command, ...args] = message.substring(constants.COMMANDS_PREFIX.length).split(' ');
		if (!command) return;

		const cmd = this.items.get(command.toLowerCase());
		if (!cmd || user.data.rank < cmd.rank) return;

		cmd.onCall(args, user);
	};
}
