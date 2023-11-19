import { PrismaClient } from '@prisma/client';

export class DatabaseManager extends PrismaClient
{
	initialized = false;
	findAnonymousUser = async (id: number) => this.user.findUnique({
		where: { id },
		select: {
			id: true,
			username: true,
			head: true,
			face: true,
			neck: true,
			body: true,
			hand: true,
			feet: true,
			color: true,
			photo: true,
			flag: true,
		},
	});

	getUsername = async (id: number) =>
	{
		const user = await this.user.findUnique({
			where: { id },
			select: {
				username: true,
			},
		});

		return user?.username;
	};

	banUser = async (moderatorId: number, userId: number, hours?: number, message?: string) =>
	{
		const expires = new Date(Date.now() + ((hours || 24) * 60 * 60 * 1000));

		// 5th ban is a permanent ban
		const count = await this.ban.count({ where: { userId } });
		if (count >= 4) await this.user.update({ where: { id: userId }, data: { permaBan: true } });

		await this.ban.create({
			data: {
				userId,
				moderatorId,
				expires,
				message: message ?? null,
			},
		});
	};

	Initialize = async () =>
	{
		await this.$connect();
		this.initialized = true;
	};
}

export const Database = new DatabaseManager();
