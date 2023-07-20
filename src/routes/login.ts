import { ErrorObject } from 'ajv';
import { compare } from 'bcrypt';
import { FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';
import { sign } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { MyAjv } from '../managers/AjvManager';
import { Config } from '../managers/ConfigManager';
import { Database } from '../managers/DatabaseManager';
import { constants } from '../utils/constants';

const getWorldPopulations = async (isModerator: boolean) =>
{
	const populations = await Database.world.findMany();
	const obj = Object.create(null);
	const maxPopulation = isModerator ? 5 : 6;

	populations.forEach((world) =>
	{
		const maxUsers = Config.data.worlds[world.id]?.maxUsers || 0;
		const populationRatio = Math.ceil(world.population / Math.round(maxUsers / 5));

		obj[world.id] = world.population >= maxUsers
			? maxPopulation
			: Math.max(populationRatio, 1);
	});

	return obj;
};

const returnError = (message: string, errors?: string) => ({ success: false, message, errors });

const getErrorMessage = (error?: ErrorObject) =>
{
	if (error === undefined) return 'Unknown error';

	switch (error.instancePath.slice(1))
	{
		case 'username': {
			switch (error.keyword)
			{
				case 'type': return 'Invalid username';
				case 'minLength': return 'Your Penguin Name is too short. Please try again';
				case 'maxLength': return 'Your Penguin Name is too long. Please try again';
				default: break;
			}

			break;
		}

		case 'password': {
			switch (error.keyword)
			{
				case 'type': return 'Invalid password';
				case 'minLength': return 'Your password is too short. Please try again';
				case 'maxLength': return 'Your password is too long. Please try again';
				default: break;
			}

			break;
		}

		default: return 'Unknown error';
	}

	return 'Unknown error';
};

const postLogin = async (req: FastifyRequest<{ Body: { username: string; password: string, method: 'password' | 'token'; }; }>, reply: FastifyReply) =>
{
	// TODO: find a better way to handle ajv errors (ajv-errors package is not working as expected) and then migrate to error code
	if (req.body.username === 'string' && req.body.username.length === 0) return reply.send(returnError('You must provide your Penguin Name to enter Club Penguin'));
	if (req.body.password === 'string' && req.body.password.length === 0) return reply.send(returnError('Your Penguin Name is too short. Please try again'));
	if (req.body.method !== 'password' && req.body.method !== 'token') return reply.code(400).send(returnError('Invalid auth method'));

	if (!MyAjv.validators.loginAuth(req.body))
	{
		return reply.send(
			returnError(
				getErrorMessage(MyAjv.validators.loginAuth.errors?.at(0)),
				MyAjv.errorsText(MyAjv.validators.loginAuth.errors),
			),
		);
	}

	const user = await Database.user.findUnique({
		where: { username: req.body.username },
		select: {
			id: true,
			username: true,
			password: true,
			permaBan: true,
			rank: true,
			auth_tokens: true,
			ban_userId: {
				take: 1,
				where: {
					expires: { gt: new Date() },
				},
				orderBy: {
					expires: 'desc',
				},
			},
		},
	});

	if (user == null)
	{
		return reply.send({
			success: false,
			message: 'Penguin not found. Try Again?', // TODO: migrate to error code
		});
	}

	// TODO: add token login
	const match = await compare(req.body.password, user.password);
	if (!match)
	{
		return reply.send({
			success: false,
			message: 'Incorrect password. NOTE: Passwords are CaSe SeNsiTIVE', // TODO: migrate to error code
		});
	}

	if (user.permaBan)
	{
		return reply.send({
			success: false,
			message: 'Banned:\nYou are banned forever', // TODO: migrate to error code
		});
	}

	if (user.ban_userId[0] !== undefined)
	{
		const hours = Math.round((user.ban_userId[0].expires.getTime() - Date.now()) / 60 / 60 / 1000);
		return reply.send({
			success: false,
			message: `Banned:\nYou are banned for the next ${hours} hours`, // TODO: migrate to error code
		});
	}

	const key = sign({}, Config.data.crypto.secret, {
		expiresIn: Config.data.crypto.loginKeyExpiry,
		jwtid: `${Date.now()}$${user.username}$${randomUUID()}`,
		audience: Config.data.crypto.audience,
		issuer: Config.data.crypto.issuer,
		subject: user.username,
	});

	return reply.send({
		success: true,
		username: user.username,
		key,
		populations: (await getWorldPopulations(user.rank >= constants.FIRST_MODERATOR_RANK)),
	});
};

const plugin: FastifyPluginCallback = function (fastify, opts, next): void
{
	fastify.post('/login', postLogin);
	next();
};

export default plugin;
