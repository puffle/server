import { ValidateFunction } from 'ajv';
import { GameWorld } from '../classes/GameWorld';
import { User } from '../classes/User';
import { IGamePlugin } from '../types/types';

export abstract class GamePlugin implements IGamePlugin
{
	abstract pluginName: string;
	world: GameWorld;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	events: Record<string, (args: any, user: User) => void> = Object.create(null);
	schemas: Record<string, ValidateFunction<unknown>> = Object.create(null);

	constructor(world: GameWorld)
	{
		this.world = world;
	}
}
