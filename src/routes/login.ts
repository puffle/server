import { compare } from 'bcrypt';
import { FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';
import { sign } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { constants } from '../utils/constants';

const getWorldPopulations = async (isModerator: boolean, req: FastifyRequest) =>
{
	const populations = await req.fastify.prisma.worlds.findMany();
	const obj = Object.create(null);
	const maxPopulation = isModerator ? 5 : 6;

	populations.forEach((world) =>
	{
		const maxUsers = req.fastify.configManager.data.worlds[world.id]?.maxUsers || 0;
		const populationRatio = Math.ceil(world.population / Math.round(maxUsers / 5));

		obj[world.id] = world.population >= maxUsers
			? maxPopulation
			: Math.max(populationRatio, 1);
	});

	return obj;
};

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
		populations: (await getWorldPopulations(user.rank >= constants.FIRST_MODERATOR_RANK, req)),
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
