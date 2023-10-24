import { hash } from 'bcrypt';
import { FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';
import { MyAjv } from '../managers/AjvManager';
import { Config } from '../managers/ConfigManager';
import { Database } from '../managers/DatabaseManager';

const craftError = (error: string) => ({
	success: false,
	error,
});

const postRegister = async (req: FastifyRequest<{ Body: { username: string, password: string, email: string, color: number; }; }>, reply: FastifyReply) =>
{
	req.body.color = Number(req.body.color);
	if (!MyAjv.validators.registerAccount(req.body)) return reply.code(400).send(craftError(MyAjv.errorsText(MyAjv.validators.registerAccount.errors)));

	const user = await Database.user.findMany({
		where: {
			OR: [
				{ username: req.body.username },
				{ email: req.body.email },
			],
		},
	});

	if (user.length !== 0) return reply.status(409).send(craftError('The username or e-mail address is already registered in our database.'));

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
