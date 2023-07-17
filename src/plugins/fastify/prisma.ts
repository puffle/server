import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { DatabaseManager } from '../../managers/DatabaseManager';

declare module 'fastify' {
	interface FastifyInstance
	{
		prisma: DatabaseManager;
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const prismaPlugin: FastifyPluginAsync = fp(async (fastify, options) =>
{
	const prisma = new DatabaseManager();
	await prisma.$connect();

	fastify.decorate('prisma', prisma);
	fastify.addHook('onClose', async (server) =>
	{
		await server.prisma.$disconnect();
	});
});
