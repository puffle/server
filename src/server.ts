import { CustomError } from '@n0bodysec/ts-utils';
import Fastify from 'fastify';
import { join } from 'node:path';
import { Server } from 'socket.io';
import { GameWorld } from './classes/GameWorld';
import { MyAjv } from './managers/AjvManager';
import { Config } from './managers/ConfigManager';
import { Database } from './managers/DatabaseManager';
import { Logger } from './managers/LogManager';
import { constants } from './utils/constants';

(async () =>
{
	const fastify = Fastify({
		logger: Logger as never,
	});

	try
	{
		const worldName = process.argv[2] ?? 'HTTP';

		MyAjv.initialize();
		await Config.Initialize();
		await Database.Initialize();
		Logger.initialize(Config.data.logLevel);

		if (!MyAjv.initialized || !Config.initialized || !Database.initialized)
		{
			Logger.error(`${constants.PROJECT_NAME} is not properly initialized. Exiting...`);
			process.exit(1);
		}

		fastify.setNotFoundHandler((error, reply) => reply.code(404).send('Not found'));
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

		// HTTP server
		if (worldName === 'HTTP')
		{
			fastify.addHook('onClose', async () => Database.$disconnect());
			fastify.register(import('@fastify/cors'));
			fastify.register(import('@fastify/helmet'), { global: true, contentSecurityPolicy: false });

			fastify.register(import('@fastify/autoload'), {
				dir: join(__dirname, 'routes'),
				options: { prefix: '/api' },
				routeParams: true,
			});

			await fastify.ready();

			Logger.info('Starting HTTP Server...');
			fastify.listen({ port: Config.data.http.port, host: Config.data.http.host });

			return;
		}

		// Game world
		const host = Config.data.worlds[worldName]?.host;
		const port = Config.data.worlds[worldName]?.port;

		if (host === undefined || port === undefined)
		{
			Logger.error('The configuration of the world is not valid. Remember to set a value for "host" and for "port". Exiting...');
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

		await fastify.ready();
		new GameWorld(worldName, io); // eslint-disable-line no-new

		Logger.info('Starting Game World Server...');
		fastify.listen({ port, host });
	}
	catch (err)
	{
		const message = typeof err === 'object' ? JSON.stringify(err) : err;
		Logger.error(message);
		process.exit(1);
	}
})();
