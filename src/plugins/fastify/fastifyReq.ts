import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
	interface FastifyRequest
	{
		fastify: FastifyInstance;
	}
}

export const fastifyReq: FastifyPluginAsync = fp(async (fastify) =>
{
	fastify.decorateRequest('fastify', null);

	fastify.addHook('onRequest', async (req) =>
	{
		req.fastify = fastify;
	});
});
