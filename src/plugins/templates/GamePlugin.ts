import { GameWorld } from '../../classes/world';

export abstract class GamePlugin
{
	abstract pluginName: string;
	world: GameWorld;

	constructor(world: GameWorld)
	{
		this.world = world;
	}
}
