import { PrismaClient } from '@prisma/client';

export class DatabaseManager extends PrismaClient
{
	findAnonymousUser = async (id: number) => this.users.findUnique({
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
}
