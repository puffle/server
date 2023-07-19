import { Socket } from 'socket.io';
import { Config } from '../managers/ConfigManager';

export function pick<T extends Record<string, unknown>>(object: T, ...keys: Array<keyof T>): Partial<T>
{
	return keys.reduce((obj, key) =>
	{
		if (object && key in object) obj[key] = object[key];
		return obj;
	}, {} as Partial<T>);
}

export function getSocketAddress(socket: Socket)
{
	if (Config.data.reverseProxy.enabled)
	{
		const headers = socket.handshake.headers;

		const ipHeader = Config.data.reverseProxy.ipHeader;
		if (ipHeader !== undefined && headers[ipHeader] !== undefined)
		{
			return Array.isArray(ipHeader) ? ipHeader[0] : ipHeader;
		}

		// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For#security_and_privacy_concerns
		const forwarded = headers['x-forwarded-for'];
		if (Config.data.reverseProxy.trustForwarded && forwarded !== undefined)
		{
			return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
		}
	}

	return socket.handshake.address;
}
