import { readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { GameWorld } from '../classes/GameWorld';
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
			Logger.debug(`Loaded plugin "${obj.pluginName}" with ${Object.keys(obj.events).length} registered events`);
			this.loadEvents(obj);
		});

		Logger.info(`Loaded ${Object.keys(this.plugins).length} plugins`);
	};

	loadEvents = (plugin: IGamePlugin) =>
	{
		const events = Object.keys(plugin.events);
		events.forEach((event) =>
		{
			if (this.world.events !== undefined)
			{
				Logger.debug(`Loaded event "${event}" from plugin ${plugin.pluginName}`);
				this.world.events.on(event, plugin.events[event]!);
			}
		});

		Logger.debug(`Loaded ${events.length} events from plugin ${plugin.pluginName}`);
	};
}
