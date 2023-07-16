import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { join } from 'node:path';
import { ConfigManager } from '../../managers/ConfigManager';

declare module 'fastify' {
	interface FastifyInstance
	{
		configManager: ConfigManager;
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const configManagerPlugin: FastifyPluginAsync = fp(async (fastify, options) =>
{
	const configManager = new ConfigManager();
	await configManager.load(join(__dirname, '..', '..', '..', 'config', 'config.json'));

	fastify.decorate('configManager', configManager);
});
