import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';
import { Server, ServerOptions } from 'socket.io';

declare module 'fastify' {
	interface FastifyInstance
	{
		io: Server;
	}
}

const p: FastifyPluginCallback<Partial<ServerOptions>> = (fastify, options, done) =>
{
	fastify.decorate('io', new Server(fastify.server, options));

	fastify.addHook('onClose', (server, hookDone) =>
	{
		server.io.close();
		hookDone();
	});

	done();
};

export const socketioServer = fp(p);
