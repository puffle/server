import { hash } from 'bcrypt';
import type { FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';
import { check } from 'ts-runtime-checks';
import { Config } from '../managers/ConfigManager';
import { Database } from '../managers/DatabaseManager';
import type { IRegisterAccount } from '../types/types';

const returnError = (message: string, errors?: string[]) => ({ success: false, message, errors });

const postRegister = async (req: FastifyRequest<{ Body: IRegisterAccount; }>, reply: FastifyReply) =>
{
	const [, errors] = check<IRegisterAccount>(req.body);
	if (errors.length) return reply.status(400).send(returnError('Bad Request', errors));

	const user = await Database.user.findMany({
		where: {
			OR: [
				{ username: req.body.username },
				{ email: req.body.email },
			],
		},
	});

	if (user.length !== 0) return reply.status(409).send(returnError('Conflict', ['The username or e-mail address is already registered in our database.']));

	const newUser = await Database.user.create({
		data: {
			username: req.body.username,
			password: await hash(req.body.password, Config.data.crypto.rounds),
			email: req.body.email,
		},
	});

	await Database.$transaction([
		Database.igloo.create({ data: { userId: newUser.id } }),
		Database.inventory.create({ data: { userId: newUser.id, itemId: req.body.color } }),
		Database.iglooInventory.create({ data: { userId: newUser.id, iglooId: 1 } }),
	]);

	return reply.send({ success: true });
};

const plugin: FastifyPluginCallback = function (fastify, opts, next): void
{
	fastify.post('/register', postRegister);
	next();
};

export default plugin;
