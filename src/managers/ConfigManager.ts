import { ConfigManager } from '@n0bodysec/config-manager';
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

export const defaultData: TConfig = {
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

export const Config = new ConfigManager<TConfig>(defaultData);
