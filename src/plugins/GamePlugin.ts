import type { GameWorld } from '../classes/GameWorld';
import type { IGamePlugin } from '../types/types';

export abstract class GamePlugin implements IGamePlugin
{
	abstract name: string;
	world: GameWorld;
	// events: Record<string, (args: any, user: User) => void> = Object.create(null);

	constructor(world: GameWorld)
	{
		this.world = world;
	}
}
