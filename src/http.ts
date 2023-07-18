import { CustomError } from '@n0bodysec/ts-utils';
import ajvErrors from 'ajv-errors';
import ajvKeywords from 'ajv-keywords';
import Fastify from 'fastify';
import { join } from 'node:path';
import { Config } from './managers/ConfigManager';
import { Database } from './managers/DatabaseManager';

(async () =>
{
	const fastify = Fastify({
		logger: true,
		ajv: {
			customOptions: {
				allErrors: true,
			},
			plugins: [ajvErrors, ajvKeywords],
		},
	});

	try
	{
		await Config.Initialize();
		await Database.Initialize();

		fastify.addHook('onClose', async () => Database.$disconnect());
		fastify.register(import('@fastify/cors'));
		fastify.register(import('@fastify/helmet'), { global: true, contentSecurityPolicy: false });

		fastify.register(import('@fastify/autoload'), {
			dir: join(__dirname, 'routes'),
			options: { prefix: '/api' },
			routeParams: true,
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
		fastify.listen({ port: Config.data.login.port, host: Config.data.login.host });
	}
	catch (err)
	{
		fastify.log.error(err);
		process.exit(1);
	}
})();
