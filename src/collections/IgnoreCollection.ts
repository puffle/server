import { User } from '../classes/User';
import { Database } from '../managers/DatabaseManager';
import { Collection } from './Collection';

export class IgnoreCollection extends Collection
{
	constructor(user: User)
	{
		super(user);

		this.user.data.ignores_userId.forEach((ignore) => this.data.set(ignore.ignoreId, ignore.ignoredUser.username));
	}

	data = new Map<number, string>();

	isOnline = (userId: number) => this.user.world.users.has(userId);

	#add = async (userId: number, username: string) => Database.ignore.create({
		data: {
			userId: this.user.data.id,
			ignoreId: userId,
		},
	}).then(() =>
	{
		this.data.set(userId, username);
		this.user.data.ignores_userId.push({ ignoreId: userId, ignoredUser: { username } });
	});

	#remove = async (userId: number) => Database.ignore.deleteMany({
		where: {
			userId: this.user.data.id,
			ignoreId: userId,
		},
	}).then(() =>
	{
		this.data.delete(userId);

		const index = this.user.data.ignores_userId.findIndex((item) => item.ignoreId === userId);
		if (index > -1) this.user.data.ignores_userId.splice(index, 1);
	});

	addIgnore = (id: number, username: string) =>
	{
		this.#add(id, username);
		this.user.send('ignore_add', { id, username });
	};

	removeIgnore = (id: number) =>
	{
		this.#remove(id);
		this.user.send('ignore_remove', { id });
	};

	toJSON = () => [...this.data].map(([id, username]) => ({ id, username }));
}
