import { User } from '../classes/User';
import { Database } from '../managers/DatabaseManager';
import { removeItemFromArray } from '../utils/functions';
import { Collection } from './Collection';

export class BuddyCollection extends Collection
{
	constructor(user: User)
	{
		super(user);

		this.user.data.buddies_userId.forEach((buddy) => this.data.set(buddy.buddyId, buddy.buddy.username));
	}

	data = new Map<number, string>();
	requests: number[] = [];

	isOnline = (userId: number) => this.user.world.users.has(userId);

	/**
	 * Sends a "friend online" notification.
	 * @param {number} buddyId - The id of the user who is to receive the notification.
	 */
	sendOnlineTo = (buddyId: number) => this.user.world.users.get(buddyId)?.send('buddy_online', { id: this.user.data.id });

	/**
	 * Sends a "friend offline" notification to all buddies of the current user.
	 */
	sendOffline = () => [...this.data.keys()].forEach((buddyId) =>
	{
		if (this.isOnline(buddyId))
		{
			this.user.world.users.get(buddyId)?.send('buddy_offline', { id: this.user.data.id });
		}
	});

	deleteRequest = (userId: number) => removeItemFromArray(this.requests, userId);

	#add = async (userId: number, username: string) => Database.buddy.create({
		data: {
			userId: this.user.data.id,
			buddyId: userId,
		},
	}).then(() =>
	{
		this.data.set(userId, username);
		this.user.data.buddies_userId.push({ buddyId: userId, buddy: { username } });
	});

	#remove = async (userId: number) => Database.buddy.deleteMany({
		where: {
			userId: this.user.data.id,
			buddyId: userId,
		},
	}).then(() =>
	{
		this.data.delete(userId);

		const index = this.user.data.buddies_userId.findIndex((item) => item.buddyId === userId);
		if (index > -1) this.user.data.buddies_userId.splice(index, 1);
	});

	addBuddy = (id: number, username: string, requester = false) =>
	{
		this.#add(id, username);
		this.user.send('buddy_accept', {
			id,
			username,
			requester,
			online: this.isOnline(id),
		});
	};

	removeBuddy = (id: number) =>
	{
		this.#remove(id);
		this.user.send('buddy_remove', { id });
	};

	toJSON = () =>
	{
		const buddies: { id: number; username: string; online: boolean; }[] = [];

		[...this.data.entries()].forEach(([id, username]) =>
		{
			const online = this.isOnline(id);
			buddies.push({
				id,
				username,
				online,
			});

			if (online) this.sendOnlineTo(id);
		});

		return buddies;
	};
}
