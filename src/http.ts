import { CustomError } from '@n0bodysec/ts-utils';
import ajvErrors from 'ajv-errors';
import ajvKeywords from 'ajv-keywords';
import Fastify, { FastifyRequest } from 'fastify';
import { fastifyReq } from './plugins/fastify/fastifyReq';

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

		fastify.post('/login', {
			schema: {
				body: {
					type: 'object',
					required: ['username', 'password'],
					properties: {
						username: {
							type: 'string',
							transform: ['trim'],
							minLength: 4,
							maxLength: 12,
						},
						password: {
							type: 'string',
							transform: ['trim'],
							minLength: 3,
							maxLength: 128,
						},
					},
				},
			},
		}, async (request: FastifyRequest<{ Body: { username: string; password: string; }; }>, reply) =>
		{
			reply.send('OK');
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
		fastify.listen({ port: 3000, host: '0.0.0.0' });
	}
	catch (err)
	{
		fastify.log.error(err);
		process.exit(1);
	}
})();
