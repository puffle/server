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

	Initialize = async () =>
	{
		await this.$connect();
		this.initialized = true;
	};
}

export const Database = new DatabaseManager();
