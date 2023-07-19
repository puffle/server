import { ValidateFunction } from 'ajv';
import { User } from '../classes/user';
import { GameWorld } from '../classes/world';
import { IGamePlugin } from '../types';

export abstract class GamePlugin implements IGamePlugin
{
	abstract pluginName: string;
	world: GameWorld;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	events: Record<string, (args: any, user: User) => void> = {};
	schemas = new Map<string, ValidateFunction<unknown>>();

	constructor(world: GameWorld)
	{
		this.world = world;
	}
}
