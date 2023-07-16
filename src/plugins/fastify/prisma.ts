import { PrismaClient } from '@prisma/client';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
	interface FastifyInstance
	{
		prisma: PrismaClient;
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const prismaPlugin: FastifyPluginAsync = fp(async (fastify, options) =>
{
	const prisma = new PrismaClient();
	await prisma.$connect();

	fastify.decorate('prisma', prisma);
	fastify.addHook('onClose', async (server) =>
	{
		await server.prisma.$disconnect();
	});
});
