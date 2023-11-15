import { Database } from '../managers/DatabaseManager';
import { removeItemFromArray } from '../utils/functions';
import { Collection } from './Collection';

export class BuddyCollection extends Collection
{
	requests: number[] = [];

	get collection() { return this.user.data.buddies_userId; }
	has = (value: number) => this.collection.some((x) => x.buddyId === value);

	isOnline = (userId: number) => this.user.world.users.has(userId);

	/**
	 * Sends a "friend online" notification.
	 * @param {number} buddyId - The id of the user who is to receive the notification.
	 */
	sendOnlineTo = (buddyId: number) => this.user.world.users.get(buddyId)?.send('buddy_online', { id: this.user.data.id });

	/**
	 * Sends a "friend offline" notification to all buddies of the current user.
	 */
	sendOffline = () => this.collection.forEach((buddy) =>
	{
		if (this.isOnline(buddy.buddyId))
		{
			this.user.world.users.get(buddy.buddyId)?.send('buddy_offline', { id: this.user.data.id });
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
		this.collection.push({ buddyId: userId, buddy: { username } });
	});

	#remove = async (userId: number) => Database.buddy.deleteMany({
		where: {
			userId: this.user.data.id,
			buddyId: userId,
		},
	}).then(() =>
	{
		const index = this.collection.findIndex((item) => item.buddyId === userId);
		if (index > -1) this.collection.splice(index, 1);
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

		this.collection.forEach((buddy) =>
		{
			const online = this.isOnline(buddy.buddyId);
			buddies.push({
				id: buddy.buddyId,
				username: buddy.buddy.username,
				online,
			});

			if (online) this.sendOnlineTo(buddy.buddyId);
		});

		return buddies;
	};
}
