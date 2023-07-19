import { merge } from 'lodash';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { constants } from '../utils/constants';

type Any = {
	[key: string]: unknown,
};

export type TConfig = {
	crypto: {
		secret: string,
		loginKeyExpiry: number,
		audience: string,
		issuer: string,
		rounds: number,
	},
	cors: {
		origin: string,
	},
	reverseProxy: {
		enabled: boolean,
		ipHeader?: string,
		trustForwarded: boolean,
	};
	login: {
		host: string,
		port: number,
	},
	worlds: {
		[key: string]: {
			host: string,
			port: number,
			maxUsers: number,
		},
	},
	game: {
		preferredSpawn: number,
		iglooIdOffset: number,
	},
};

export class ConfigManager
{
	constructor(defaultData?: TConfig)
	{
		this.data = Object.create(defaultData ?? this.defaultData);
	}

	initialized = false;
	data: TConfig;
	defaultData: TConfig = {
		crypto: {
			secret: 'UNSECURE SECRET - DO NOT USE ME',
			loginKeyExpiry: 86400,
			audience: 'localhost',
			issuer: constants.PROJECT_NAME,
			rounds: 30,
		},
		cors: {
			origin: 'http://localhost:8080',
		},
		reverseProxy: {
			enabled: false,
			trustForwarded: false,
		},
		login: {
			host: 'localhost',
			port: 6111,
		},
		worlds: {
			Blizzard: {
				host: 'localhost',
				port: 6112,
				maxUsers: 300,
			},
		},
		game: {
			preferredSpawn: 0,
			iglooIdOffset: 2000,
		},
	};

	Initialize = async (path?: string) =>
	{
		await this.#load(path ?? join(__dirname, '..', '..', 'config', 'config.json'));
		this.initialized = true;
	};

	#load = async (path: string) =>
	{
		const file = await readFile(path, 'utf-8');
		this.data = JSON.parse(file);
		this.sanitize();
	};

	sanitize = () =>
	{
		// sanitize the typeof data loaded from config
		this.#sanitizeType(this.defaultData, this.data);

		// merge data not found in the loaded config
		this.data = merge(this.defaultData, this.data);
	};

	#sanitizeType = (src: Record<string, unknown>, dst: Record<string, unknown>) =>
	{
		Object.keys(dst).filter((key) => key in src).forEach((key) =>
		{
			const type1 = typeof (dst as Any)[key];
			const type2 = typeof (src as Any)[key];

			// check if we can actually read a default data to compare against
			if (type2 !== 'undefined')
			{
				if (type1 === 'object' && src[key] != null) this.#sanitizeType(src[key] as Record<string, unknown>, dst[key] as Record<string, unknown>);
				if (type1 !== type2) (dst as Any)[key] = (src as Any)[key];
			}
		});
	};
}

export const Config = new ConfigManager();
