import { compare, hash } from 'bcrypt';
import { FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';
import { sign } from 'jsonwebtoken';
import { randomBytes, randomUUID } from 'node:crypto';
import { MyAjv } from '../managers/AjvManager';
import { Config } from '../managers/ConfigManager';
import { Database } from '../managers/DatabaseManager';
import { ILoginAuth } from '../types/types';
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

// TODO: migrate to error code
const errorMessages = Object.create({
	username: Object.create({
		type: 'Invalid username',
		minLength: 'Your Penguin Name is too short. Please try again',
		maxLength: 'Your Penguin Name is too long. Please try again',
		stringEmpty: 'You must provide your Penguin Name to enter Club Penguin',
	}),

	password: Object.create({
		type: 'Invalid password',
		minLength: 'Your password is too short. Please try again',
		maxLength: 'Your password is too long. Please try again',
		stringEmpty: 'You must provide your password to enter Club Penguin',
	}),
});

const getErrorMessage = (key: string, keyword: string) =>
{
	const errorKey = errorMessages[key];

	return errorKey !== undefined && keyword !== undefined && errorKey[keyword] !== undefined
		? errorKey[keyword] as string | undefined || 'Unknown error'
		: 'Unknown error';
};

const createTokens = async () =>
{
	const tokenId = randomUUID();
	const publicKey = randomBytes(32).toString('hex');
	const privateKey = await hash(publicKey, Config.data.crypto.rounds);

	return { tokenId, publicKey, privateKey };
};

const genTokenDates = () =>
{
	const currentDate = new Date();
	const validUntil = new Date(currentDate);
	if (Config.data.login.enableExpiration) validUntil.setDate(validUntil.getDate() + Config.data.login.tokenDuration);

	return { currentDate, validUntil };
};

const postLogin = async (req: FastifyRequest<{ Body: ILoginAuth; }>, reply: FastifyReply) =>
{
	// TODO: find a better way to handle ajv errors (ajv-errors package is not working as expected) and then migrate to error code
	if (typeof req.body.username !== 'string' || req.body.username.length === 0) return reply.send(returnError(getErrorMessage('username', 'stringEmpty')));
	if (typeof req.body.password !== 'string' || req.body.password.length === 0) return reply.send(returnError(getErrorMessage('password', 'stringEmpty')));

	if (!MyAjv.validators.loginAuth(req.body))
	{
		const firstError = MyAjv.validators.loginAuth.errors?.at(0);
		return reply.send(
			returnError(
				getErrorMessage(firstError?.instancePath.slice(1) ?? '', firstError?.keyword ?? ''),
				MyAjv.errorsText(MyAjv.validators.loginAuth.errors),
			),
		);
	}

	const user = await Database.user.findUnique({
		where: { username: req.body.username },
		include: {
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
	let tokenId: string | undefined;
	let publicKey: string | undefined;

	if (req.body.method === 'password') // password login
	{
		match = await compare(req.body.password, user.password);

		if (match && req.body.createToken) // create token if requested but only if password is valid
		{
			const token = await createTokens();
			const dates = genTokenDates();

			const tokenData = {
				userId: user.id,
				tokenId: token.tokenId,
				token: token.privateKey,
				timestamp: dates.currentDate,
				validUntil: dates.validUntil,
			};

			// insert a new token
			await Database.authToken.create({ data: tokenData });
			user.auth_tokens.push(tokenData);

			({ tokenId, publicKey } = token);
		}
	}
	else // token login
	{
		const split = req.body.password.split(':');
		if (split.length === 2 && split[0] !== undefined && split[1] !== undefined) // only do checks if sent token has the correct format
		{
			const dates = genTokenDates();

			// delete expired tokens
			if (Config.data.login.enableExpiration)
			{
				await Database.authToken.deleteMany({
					where: {
						userId: user.id,
						validUntil: { lt: dates.currentDate },
					},
				});

				user.auth_tokens = user.auth_tokens.filter((x) => x.validUntil >= dates.currentDate);
			}

			const validToken = user.auth_tokens.find((token) => token.tokenId === split[0]);
			if (validToken !== undefined) // if token is found with the given tokenId
			{
				match = await compare(split[1], validToken.token);

				// update token expiration date
				if (match && Config.data.login.enableExpiration)
				{
					await Database.authToken.updateMany({
						where: { tokenId: validToken.tokenId },
						data: { validUntil: dates.validUntil },
					});

					validToken.validUntil = dates.validUntil;
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

	const penguinData = {
		head: user.head,
		face: user.face,
		neck: user.neck,
		body: user.body,
		hand: user.hand,
		feet: user.feet,
		color: user.color,
		joinTime: user.joinTime,
	};

	const penguin = (tokenId !== undefined && publicKey !== undefined)
		? { ...penguinData, token: `${tokenId}:${publicKey}` }
		: penguinData;

	return reply.send({
		success: true,
		username: user.username,
		key,
		populations: (await getWorldPopulations(user.rank >= constants.FIRST_MODERATOR_RANK)),
		penguin,
	});
};

const plugin: FastifyPluginCallback = function (fastify, opts, next): void
{
	fastify.post('/login', postLogin);
	next();
};

export default plugin;
