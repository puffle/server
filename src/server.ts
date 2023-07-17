import { CustomError } from '@n0bodysec/ts-utils';
import Fastify from 'fastify';
import { Server } from 'socket.io';
import { GameWorld } from './classes/world';
import { Config } from './managers/ConfigManager';
import { Database } from './managers/DatabaseManager';

(async () =>
{
	const fastify = Fastify({
		logger: true,
	});

	try
	{
		await Config.Initialize();
		await Database.Initialize();

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
		const worldName = process.argv.slice(2)[0];

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
