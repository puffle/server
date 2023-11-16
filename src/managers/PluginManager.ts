import { readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { GameWorld } from '../classes/GameWorld';
import { IEventDecoratorMetadata } from '../decorators/event';
import { IGamePlugin } from '../types/types';
import { Logger } from './LogManager';

export class PluginManager
{
	path: string;
	plugins: Record<string, IGamePlugin> = Object.create(null);
	world: GameWorld;

	constructor(world: GameWorld, folderName: string)
	{
		this.world = world;
		this.path = join('..', 'plugins', folderName);
		this.loadPlugins();
	}

	loadPlugins = async () =>
	{
		const files = (await readdir(join(__dirname, this.path))).filter((file) => ['.js', '.ts'].includes(extname(file)));
		const promises = await Promise.all(files.map((file) => import(`${this.path}/${file}`)));

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		promises.forEach((plugin: any) =>
		{
			const Plugin = plugin.default;
			const obj = new Plugin(this.world) as IGamePlugin;
			this.plugins[obj.pluginName] = obj;
			Logger.debug(`Loaded plugin: ${obj.pluginName}`);
			this.loadEvents(obj);
		});

		Logger.info(`Loaded ${Object.keys(this.plugins).length} plugins`);
	};

	loadEvents = (plugin: IGamePlugin) =>
	{
		let count = 0;
		Object.getOwnPropertyNames(Object.getPrototypeOf(plugin)).forEach((method) =>
		{
			const metadata = Reflect.getMetadata('PluginEvent', plugin, method) as IEventDecoratorMetadata | undefined;
			if (metadata !== undefined)
			{
				const fn = (plugin as unknown as Record<string, () => void>)[method];
				if (typeof fn === 'function')
				{
					Logger.debug(`Loaded event: ${metadata.eventName} (${method}) — from plugin ${plugin.pluginName}`);
					this.world.events.on(metadata.eventName, fn.bind(plugin));
					count++;
				}
			}
		});

		Logger.debug(`Loaded ${count} events from plugin ${plugin.pluginName}`);
	};
}
