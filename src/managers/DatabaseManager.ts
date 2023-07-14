import { PrismaClient } from '@prisma/client';

export class DatabaseManager extends PrismaClient
{
	authenticate = async () =>
	{
		await this.$queryRaw`SELECT 1`;
	};
}
