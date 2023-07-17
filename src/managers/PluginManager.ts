import { readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { GameWorld } from '../classes/world';

export class PluginManager
{
	path: string;
	plugins = new Map<string, IGamePlugin>();
	world: GameWorld;

	constructor(world: GameWorld, folderName: string)
	{
		this.world = world;
		this.path = join(__dirname, '..', 'plugins', folderName);
		this.loadPlugins();
	}

	loadPlugins = async () =>
	{
		const files = (await readdir(this.path)).filter((file) =>
		{
			const ext = extname(file);
			return ext === '.js' || ext === '.ts';
		});

		const promises = await Promise.all(files.map((file) => import(join(this.path, file))));

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		promises.forEach((plugin: any) =>
		{
			const Plugin = plugin.default;
			const obj = new Plugin(this.world) as IGamePlugin;
			this.plugins.set(obj.pluginName, obj);
			console.log(`[${this.world.id}] Loaded plugin "${obj.pluginName}" with ${Object.keys(obj.events).length} registered events`);
			this.loadEvents(obj);
		});

		console.log(`[${this.world.id}] Loaded ${this.plugins.size} plugins`);
	};

	loadEvents = (plugin: IGamePlugin) =>
	{
		const events = Object.keys(plugin.events);
		events.forEach((event) =>
		{
			if (this.world.events !== undefined)
			{
				// console.log(`[${this.world.id}] Loaded event "${event}" from plugin ${plugin.pluginName}`);
				this.world.events.on(event, plugin.events[event]!);
			}
		});

		// console.log(`[${this.world.id}] Loaded ${events.length} events from plugin ${plugin.pluginName}`);
	};
}
