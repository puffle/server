import { CustomError } from '@n0bodysec/ts-utils';
import Fastify from 'fastify';
import { GameWorld } from './classes/world';
import { configManagerPlugin } from './plugins/fastify/configManager';
import { fastifyReq } from './plugins/fastify/fastifyReq';
import { prismaPlugin } from './plugins/fastify/prisma';
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
		fastify.register(prismaPlugin);
		fastify.register(configManagerPlugin);

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

		if (worldName !== undefined)
		{
			if (fastify.configManager.data.worlds[worldName] === undefined || fastify.configManager.data.worlds[worldName]?.host === undefined || fastify.configManager.data.worlds[worldName]?.port === undefined) return;
			const world = new GameWorld(worldName, fastify.io, fastify.configManager, fastify.prisma);
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
