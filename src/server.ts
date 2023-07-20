import { CustomError } from '@n0bodysec/ts-utils';
import Fastify from 'fastify';
import { Server } from 'socket.io';
import { GameWorld } from './classes/GameWorld';
import { MyAjv } from './managers/AjvManager';
import { Config } from './managers/ConfigManager';
import { Database } from './managers/DatabaseManager';
import { constants } from './utils/constants';

(async () =>
{
	const fastify = Fastify({
		logger: true,
	});

	try
	{
		const worldName = process.argv.slice(2)[0];

		MyAjv.initialize();
		await Config.Initialize();
		await Database.Initialize();

		if (!MyAjv.initialized || !Config.initialized || !Database.initialized)
		{
			console.error(`[${worldName ?? 'SERVER'}] ${constants.PROJECT_NAME} is not properly initialized. Exiting...`);
			process.exit(1);
		}

		const io = new Server(fastify.server, {
			path: '/',
			cors: {
				origin: Config.data.cors.origin,
				methods: ['GET', 'POST'],
			},
		});

		fastify.addHook('onClose', async () =>
		{
			io.close();
			await Database.$disconnect();
		});

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
		if (worldName !== undefined)
		{
			if (Config.data.worlds[worldName] === undefined || Config.data.worlds[worldName]?.host === undefined || Config.data.worlds[worldName]?.port === undefined) return;

			// eslint-disable-next-line no-new
			new GameWorld(worldName, io);
			fastify.listen({ port: Config.data.worlds[worldName]!.port, host: Config.data.worlds[worldName]!.host });
		}
	}
	catch (err)
	{
		console.error(err);
		// fastify.log.error(err);
		process.exit(1);
	}
})();
