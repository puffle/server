import { compare } from 'bcrypt';
import { FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';
import { sign } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';

const postLogin = async (req: FastifyRequest<{ Body: { username: string; password: string; }; }>, reply: FastifyReply) =>
{
	const user = await req.fastify.prisma.users.findUnique({ where: { username: req.body.username }, include: { bans_bans_userIdTousers: false } });

	if (user == null)
	{
		return reply.send({
			success: false,
			message: 'not found',
		});
	}

	// TODO: add token login
	const match = await compare(req.body.password, user.password);
	if (!match)
	{
		return reply.send({
			success: false,
			message: 'invalid password',
		});
	}

	if (user.permaBan)
	{
		return reply.send({
			success: false,
			message: 'perma banned',
		});
	}

	// TODO: add temp ban

	const key = sign({}, req.fastify.configManager.data.crypto.secret, {
		expiresIn: req.fastify.configManager.data.crypto.loginKeyExpiry,
		jwtid: `${Date.now()}$${req.body.username}$${randomUUID()}`,
		audience: req.fastify.configManager.data.crypto.audience,
		issuer: req.fastify.configManager.data.crypto.issuer,
		subject: user.id.toString(),
	});

	return reply.send({
		success: true,
		username: req.body.username,
		key,
		populations: {
			Blizzard: 4, // TODO: finish population
		},
	});
};

const plugin: FastifyPluginCallback = function (fastify, opts, next): void
{
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
	}, postLogin);

	next();
};

export default plugin;
