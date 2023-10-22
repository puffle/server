import { Database } from '../managers/DatabaseManager';
import { Collection } from './Collection';

export class IgnoreCollection extends Collection
{
	get collection() { return this.user.data.ignores_userId; }
	has = (value: number) => this.collection.some((x) => x.ignoreId === value);

	isOnline = (userId: number) => this.user.world.users.has(userId);

	#add = async (userId: number, username: string) => Database.ignore.create({
		data: {
			userId: this.user.data.id,
			ignoreId: userId,
		},
	}).then(() =>
	{
		this.collection.push({ ignoreId: userId, ignoredUser: { username } });
	});

	#remove = async (userId: number) => Database.ignore.deleteMany({
		where: {
			userId: this.user.data.id,
			ignoreId: userId,
		},
	}).then(() =>
	{
		const index = this.collection.findIndex((item) => item.ignoreId === userId);
		if (index > -1) this.collection.splice(index, 1);
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

	toJSON = () => this.collection.map((x) => ({ id: x.ignoreId, username: x.ignoredUser.username }));
}
