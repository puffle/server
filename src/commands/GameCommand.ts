import type { GameWorld } from '../classes/GameWorld';
import type { User } from '../classes/user/User';
import type { IGameCommand } from '../types/types';

export abstract class GameCommand implements IGameCommand
{
	/**
	 * The command name (e.g. jr).
	 */
	abstract name: string;

	/**
	 * The mininum rank to be able to use the command.
	 * Set it to zero if you want it to be available to everyone.
	 */
	rank = 0;

	/**
	 * The GameWorld instance.
	 */
	world: GameWorld;

	constructor(world: GameWorld)
	{
		this.world = world;
	}

	/**
	 * The main method to be called when a command is processed.
	 *
	 * @param args - An array of strings containing the arguments of the command.
	 * @param user - The user object who called the command.
	 */
	abstract onCall(args: string[], user: User): void | Promise<void>;
}
