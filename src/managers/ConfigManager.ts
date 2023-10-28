import { merge } from 'lodash';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { constants } from '../utils/constants';

export type TConfig = {
	logLevel: string,
	crypto: {
		secret: string,
		jwtExpiry: number,
		audience: string,
		issuer: string,
		rounds: number,
	},
	cors: {
		origin: string,
	},
	reverseProxy: {
		enabled: boolean,
		ipHeader: string,
		separator: string,
	};
	rateLimits: {
		enabled: boolean,
		connections: {
			points: number;
			duration: number;
		},
		messages: {
			points: number;
			duration: number;
		},
	};
	http: {
		host: string,
		port: number,
	},
	worlds: Record<string, {
		host: string,
		port: number,
		maxUsers: number,
	}>,
	game: {
		preferredSpawn: number,
		iglooIdOffset: number,
		fixSync: boolean,
	},
	login: {
		tokenDuration: number, // in days
		enableExpiration: boolean,
	};
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
		logLevel: 'info',
		crypto: {
			secret: 'UNSECURE SECRET - DO NOT USE ME',
			jwtExpiry: 600,
			audience: 'localhost',
			issuer: constants.PROJECT_NAME,
			rounds: 10,
		},
		cors: {
			origin: 'http://localhost:8080',
		},
		reverseProxy: {
			enabled: false,
			ipHeader: 'X-Forwarded-For',
			separator: ',',
		},
		rateLimits: {
			enabled: false,
			connections: {
				points: 5,
				duration: 1,
			},
			messages: {
				points: 50,
				duration: 1,
			},
		},
		http: {
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
			fixSync: false,
		},
		login: {
			tokenDuration: 30,
			enableExpiration: true,
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
			const type1 = typeof dst[key];
			const type2 = typeof src[key];

			// check if we can actually read a default data to compare against
			if (type2 !== 'undefined')
			{
				if (type1 === 'object' && src[key] != null) this.#sanitizeType(src[key] as Record<string, unknown>, dst[key] as Record<string, unknown>);
				if (type1 !== type2) dst[key] = src[key];
			}
		});
	};
}

export const Config = new ConfigManager();
