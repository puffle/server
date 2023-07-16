import { CustomError } from '@n0bodysec/ts-utils';
import ajvErrors from 'ajv-errors';
import ajvKeywords from 'ajv-keywords';
import Fastify from 'fastify';
import { join } from 'node:path';
import { configManagerPlugin } from './plugins/fastify/configManager';
import { fastifyReq } from './plugins/fastify/fastifyReq';
import { prismaPlugin } from './plugins/fastify/prisma';

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
		fastify.register(import('@fastify/cors'));
		fastify.register(import('@fastify/helmet'), { global: true, contentSecurityPolicy: false });
		fastify.register(fastifyReq);
		fastify.register(prismaPlugin);
		fastify.register(configManagerPlugin);

		fastify.register(import('@fastify/autoload'), {
			dir: join(__dirname, 'routes'),
			options: { prefix: '/api' },
			routeParams: true,
		});

		fastify.setErrorHandler((error, req, reply) =>
		{
			// TODO: add custom error handling for invalid ajv schema
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
		fastify.listen({ port: 6111, host: '0.0.0.0' });
	}
	catch (err)
	{
		fastify.log.error(err);
		process.exit(1);
	}
})();
