import { merge } from 'lodash';
import { readFile } from 'node:fs/promises';

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
};

export class ConfigManager
{
	constructor(defaultData?: TConfig)
	{
		this.data = Object.create(defaultData ?? this.defaultData);
	}

	data: TConfig;
	defaultData: TConfig = {
		crypto: {
			secret: 'UNSECURE SECRET - DO NOT USE ME',
			loginKeyExpiry: 86400,
			audience: 'localhost',
			issuer: 'Puffle',
			rounds: 30,
		},
		cors: {
			origin: 'http://localhost:8080',
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
	};

	load = async (path: string) =>
	{
		const file = await readFile(path, 'utf-8');
		this.data = JSON.parse(file);
		this.sanitize();
	};

	sanitize = () =>
	{
		// sanitize the typeof data loaded from config
		this.sanitizeType(this.defaultData, this.data);

		// merge data not found in the loaded config
		this.data = merge(this.defaultData, this.data);
	};

	private sanitizeType = (src: Record<string, unknown>, dst: Record<string, unknown>) =>
	{
		Object.keys(dst).filter((key) => key in src).forEach((key) =>
		{
			const type1 = typeof (dst as Any)[key];
			const type2 = typeof (src as Any)[key];

			// check if we can actually read a default data to compare against
			if (type2 !== 'undefined')
			{
				if (type1 === 'object' && src[key] != null) this.sanitizeType(src[key] as Record<string, unknown>, dst[key] as Record<string, unknown>);
				if (type1 !== type2) (dst as Any)[key] = (src as Any)[key];
			}
		});
	};
}
