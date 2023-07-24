import { ErrorObject } from 'ajv';
import { compare, hash } from 'bcrypt';
import { FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';
import { sign } from 'jsonwebtoken';
import { randomBytes, randomUUID } from 'node:crypto';
import { MyAjv } from '../managers/AjvManager';
import { Config } from '../managers/ConfigManager';
import { Database } from '../managers/DatabaseManager';
import { constants } from '../utils/constants';

const getWorldPopulations = async (isModerator: boolean) =>
{
	const populations = await Database.world.findMany();
	const obj = Object.create(null) as Record<string, unknown>;
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

const createTokens = async () =>
{
	const selector = randomUUID();
	const publicKey = randomBytes(32).toString('hex');
	const privateKey = await hash(publicKey, Config.data.crypto.rounds);

	return { selector, publicKey, privateKey };
};

const postLogin = async (req: FastifyRequest<{ Body: { username: string; password: string, method: 'password' | 'token'; }, createToken: boolean; }>, reply: FastifyReply) =>
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
			bans_userId: {
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

	let match = false;
	let selector: string | undefined;
	let publicKey: string | undefined;

	if (req.body.method === 'password') // password login
	{
		match = await compare(req.body.password, user.password);

		if (match && req.body.createToken) // create token if requested but only if password is valid
		{
			const token = await createTokens();
			await Database.authToken.create({ data: { userId: user.id, selector: token.selector, validator: token.privateKey } }); // insert new token
			({ selector, publicKey } = token);
		}
	}
	else // token login
	{
		const split = req.body.password.split(':');
		if (split.length === 2 && split[0] !== undefined && split[1] !== undefined) // only do checks if sent token has the correct format
		{
			const validToken = user.auth_tokens.find((token) => token.selector === split[0]);
			if (validToken !== undefined) // if token is found with the given selector
			{
				match = await compare(split[1], validToken.validator);

				if (match) // if token is valid, delete old token and create a new one
				{
					const token = await createTokens();
					await Database.$transaction([
						Database.authToken.deleteMany({ where: { userId: user.id, selector: split[0], validator: validToken.validator } }), // delete used token
						Database.authToken.create({ data: { userId: user.id, selector: token.selector, validator: token.privateKey } }), // insert new token
					]);

					({ selector, publicKey } = token);
				}
			}
		}
	}

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

	if (user.bans_userId[0] !== undefined)
	{
		const hours = Math.round((user.bans_userId[0].expires.getTime() - Date.now()) / 60 / 60 / 1000);
		return reply.send({
			success: false,
			message: `Banned:\nYou are banned for the next ${hours} hours`, // TODO: migrate to error code
		});
	}

	const key = sign({}, Config.data.crypto.secret, {
		expiresIn: Config.data.crypto.jwtExpiry,
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
		token: (selector !== undefined && publicKey !== undefined) ? `${selector}:${publicKey}` : undefined,
	});
};

const plugin: FastifyPluginCallback = function (fastify, opts, next): void
{
	fastify.post('/login', postLogin);
	next();
};

export default plugin;
