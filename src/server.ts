import { CustomError } from '@n0bodysec/ts-utils';
import Fastify from 'fastify';
import { join } from 'node:path';
import { GameWorld } from './classes/worlds/GameWorld';
import { LoginWorld } from './classes/worlds/LoginWorld';
import { ConfigManager } from './managers/ConfigManager';
import { fastifyReq } from './plugins/fastify/fastifyReq';
import { socketioServer } from './plugins/fastify/socket-io';

(async () =>
{
	const fastify = Fastify({
		logger: true,
	});

	try
	{
		fastify.register(socketioServer, {
			path: '/',
			cors: {
				origin: '*', // TODO: only for dev purposes!
			},
		});

		fastify.register(fastifyReq);

		fastify.setErrorHandler((error, req, reply) =>
		{
			if (error instanceof CustomError)
			{
				reply.status(error.code).send({
					message: error.message,
					extras: error.extra,
					code: error.code,
				});
			}
			else reply.send(error);
		});

		fastify.setNotFoundHandler((error, reply) =>
		{
			reply.code(404).send('Not found');
		});

		await fastify.ready();

		// TODO: rewrite this, add proper error handling
		const worldName = process.argv.slice(2)[0];
		const configManager = new ConfigManager();
		await configManager.load(join(__dirname, '..', 'config', 'config.json'));
		configManager.sanitize();

		if (worldName === 'Login')
		{
			if (configManager.data.worlds[worldName] === undefined || configManager.data.worlds[worldName]?.host === undefined || configManager.data.worlds[worldName]?.port === undefined) return;
			const world = new LoginWorld(worldName, fastify.io, configManager);
			await world.db.authenticate();
			fastify.listen({ port: world.config.data.worlds[worldName]!.port, host: world.config.data.worlds[worldName]!.host });
		}
		else if (worldName !== undefined)
		{
			if (configManager.data.worlds[worldName] === undefined || configManager.data.worlds[worldName]?.host === undefined || configManager.data.worlds[worldName]?.port === undefined) return;
			const world = new GameWorld(worldName, fastify.io, false, configManager);
			await world.db.authenticate();
			fastify.listen({ port: world.config.data.worlds[worldName]!.port, host: world.config.data.worlds[worldName]!.host });
		}
	}
	catch (err)
	{
		console.error(err);
		// fastify.log.error(err);
		process.exit(1);
	}
})();
