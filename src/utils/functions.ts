import { Socket } from 'socket.io';
import { Config } from '../managers/ConfigManager';

export const getIglooId = (userId: number) => Config.data.game.iglooIdOffset + userId;

export function pick<T extends Record<string, unknown>, K extends keyof T>(object: T, properties: K[]): Pick<T, K>
{
	const result = {} as Pick<T, K>;
	properties.forEach((property) => { result[property] = object[property]; });
	return result;
}

export function getSocketAddress(socket: Socket)
{
	if (Config.data.reverseProxy.enabled)
	{
		const headers = socket.handshake.headers;
		const ipHeader = Config.data.reverseProxy.ipHeader;

		if (headers[ipHeader] !== undefined)
		{
			const header = headers[ipHeader];

			if (typeof header === 'string')
			{
				const ips = header.split(Config.data.reverseProxy.separator);
				if (typeof ips[0] === 'string') return ips[0];
			}
			else if (Array.isArray(header) && typeof header[0] === 'string') return header[0];
		}
	}

	return socket.handshake.address;
}

export function removeItemFromArray<T>(arr: Array<T>, value: T): Array<T>
{
	const index = arr.indexOf(value);
	if (index > -1) arr.splice(index, 1);
	return arr;
}
