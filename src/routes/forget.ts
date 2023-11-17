import { compare } from 'bcrypt';
import { FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';
import { check } from 'ts-runtime-checks';
import { Database } from '../managers/DatabaseManager';
import { IForgetAuth } from '../types/types';

const returnError = (message: string, errors?: string[]) => ({ success: false, message, errors });

const postForget = async (req: FastifyRequest<{ Body: IForgetAuth; }>, reply: FastifyReply) =>
{
	const [, errors] = check<IForgetAuth>(req.body);
	if (errors.length) return reply.status(400).send(returnError('Bad Request', errors));

	const user = await Database.user.findUnique({
		where: {
			username: req.body.username,
		},
	});

	if (user == null) return reply.status(404).send(returnError('Not Found', ['User not found']));

	const match = await compare(req.body.password, user.password);
	if (!match) return reply.status(401).send(returnError('Unauthorized', ['Invalid password']));

	await Database.authToken.deleteMany({
		where: {
			userId: user.id,
		},
	});

	return reply.send({
		success: true,
		message: 'All tokens were deleted',
	});
};

const plugin: FastifyPluginCallback = function (fastify, opts, next): void
{
	fastify.post('/forget', postForget);
	next();
};

export default plugin;
