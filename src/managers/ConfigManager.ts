import { readFile } from 'node:fs/promises';

type Any = {
	[key: string]: unknown,
};

export type TConfig = {
	crypto: {
		secret: string,
		loginKeyExpiry: number,
		rounds: number,
	},
	worlds: {
		[key: string]: {
			host: string,
			port: number,
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
			loginKeyExpiry: 300,
			rounds: 30,
		},
		worlds: {
			Login: {
				host: 'localhost',
				port: 6111,
			},
			Blizzard: {
				host: 'localhost',
				port: 6112,
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
		Object.keys(this.data).forEach((key) =>
		{
			if (key in this.defaultData)
			{
				const type1 = typeof (this.data as Any)[key];
				const type2 = typeof (this.defaultData as Any)[key];

				// check if we can actually read a default data to compare against
				if (type2 !== 'undefined' && type1 !== type2)
				{
					(this.data as Any)[key] = (this.defaultData as Any)[key];
				}
			}
		});

		// sanitize data not found in the loaded config
		Object.keys(this.defaultData).forEach((key) =>
		{
			if (!(key in this.data))
			{
				(this.data as Any)[key] = (this.defaultData as Any)[key];
			}
		});
	};
}
