import { join } from 'node:path';
import { GameWorld } from '../classes/GameWorld';
import { GetPluginEventMetadata } from '../decorators/event';
import { IGamePlugin } from '../types/types';
import { Loadable } from '../utils/Loadable';
import { Logger } from './LogManager';

export class PluginManager extends Loadable<IGamePlugin>
{
	type = 'Plugin';

	constructor(world: GameWorld)
	{
		super(world, join(__dirname, '..', 'plugins'));
	}

	loadAdditional(plugin: IGamePlugin)
	{
		let count = 0;
		Object.getOwnPropertyNames(Object.getPrototypeOf(plugin)).forEach((method) =>
		{
			const metadata = GetPluginEventMetadata(plugin, method);
			if (metadata !== undefined)
			{
				const fn = (plugin as unknown as Record<string, () => void>)[method];
				if (typeof fn === 'function')
				{
					Logger.debug(`Loaded event: ${metadata.eventName} (${method}) — from plugin ${plugin.name}`);
					this.world.events.on(metadata.eventName, fn.bind(plugin));
					count++;
				}
			}
		});

		Logger.debug(`Loaded ${count} events from plugin ${plugin.name}`);
	}
}
