import { readdir, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { GameWorld } from '../classes/GameWorld';
import { Logger } from '../managers/LogManager';

interface ILoadable { name: string; }

export abstract class Loadable<T extends ILoadable>
{
	abstract type: string;
	path: string;
	items: Map<string, T> = new Map();
	world: GameWorld;

	constructor(world: GameWorld, path: string)
	{
		this.world = world;
		this.path = path;
		this.loadItems();
	}

	abstract loadAdditional(item: T): void;

	async loadItems()
	{
		const promises = await this.loadFiles();

		promises.forEach((itemModule) =>
		{
			const ItemConstructor = itemModule.default;
			const item = new ItemConstructor(this.world);

			if (this.items.has(item.name)) Logger.warn(`${this.type} ${item.name} already exists, skipping initialization`);
			else
			{
				this.items.set(item.name, item);
				Logger.debug(`Loaded ${this.type.toLowerCase()}: ${item.name}`);
				this.loadAdditional(item);
			}
		});

		Logger.info(`Loaded ${this.items.size} ${this.type.toLowerCase()}s`);
	}

	async loadFiles()
	{
		const files = await this.getAllFiles(this.path);
		const filteredFiles = files.filter(
			(file) => ['.js', '.ts'].includes(extname(file)),
		);

		const promises = await Promise.all(
			filteredFiles.map((file) => import(file) as Promise<{ default: new (world: GameWorld) => T; }>),
		);

		return promises;
	}

	async getAllFiles(dir: string): Promise<string[]>
	{
		const subdirs = await readdir(dir);
		const files = await Promise.all(
			subdirs.map(async (subdir) =>
			{
				const res = join(dir, subdir);
				const isDirectory = (await stat(res)).isDirectory();

				// return isDirectory ? this.getAllFiles(res) : res;

				if (isDirectory) return this.getAllFiles(res);
				return dir === this.path ? [] : res; // ignore files that aren't stored in subfolders of the given path
			}),
		);

		return files.flat();
	}
}
