import typia, { tags } from 'typia';
import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { Database } from '../../managers/DatabaseManager';
import { IGamePlugin } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IGenericBuddyArgs { id: number & tags.Type<'uint32'> & tags.Minimum<0> & tags.Maximum<typeof constants.limits.sql.MAX_UNSIGNED_INTEGER>; }

export default class BuddyPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Buddy';

	@Event('buddy_request')
	buddyRequest(args: IGenericBuddyArgs, user: User)
	{
		if (!typia.equals(args)) return;

		const recipient = this.world.users.get(args.id);
		if (
			recipient === undefined
			|| recipient.data.id === user.data.id
			|| recipient.buddies.requests.includes(user.data.id)
			|| recipient.buddies.has(user.data.id)
			|| recipient.ignores.has(user.data.id)
		) return;

		recipient.buddies.requests.push(user.data.id);
		recipient.send('buddy_request', { id: user.data.id, username: user.data.username });
	}

	@Event('buddy_accept')
	async buddyAccept(args: IGenericBuddyArgs, user: User)
	{
		if (!typia.equals(args)) return;

		if (!user.buddies.requests.includes(args.id) || user.buddies.has(args.id)) return;

		user.buddies.deleteRequest(args.id);

		const requester = this.world.users.get(args.id);
		let username: string | undefined;

		if (requester !== undefined) // user is still connected
		{
			username = requester.data.username;
			requester.buddies.addBuddy(user.data.id, user.data.username, true);
		}
		else // user sent friend request and logged out
		{
			username = await Database.getUsername(args.id);
			if (username === undefined) return;

			await Database.buddy.create({
				data: {
					userId: args.id,
					buddyId: user.data.id,
				},
			});
		}

		user.buddies.addBuddy(args.id, username);
	}

	@Event('buddy_reject')
	buddyReject(args: IGenericBuddyArgs, user: User)
	{
		if (!typia.equals(args)) return;

		user.buddies.deleteRequest(args.id);
	}

	@Event('buddy_remove')
	async buddyRemove(args: IGenericBuddyArgs, user: User)
	{
		if (!typia.equals(args)) return;

		if (!user.buddies.has(args.id)) return;

		user.buddies.removeBuddy(args.id);

		const buddy = this.world.users.get(args.id);

		if (buddy !== undefined) // buddy is connected
		{
			buddy.buddies.removeBuddy(user.data.id);
		}
		else // buddy is not connected
		{
			await Database.buddy.deleteMany({
				where: {
					userId: args.id,
					buddyId: user.data.id,
				},
			});
		}
	}

	@Event('buddy_find')
	buddyFind(args: IGenericBuddyArgs, user: User)
	{
		if (!typia.equals(args)) return;

		const buddy = this.world.users.get(args.id);
		if (buddy === undefined || buddy.room === undefined || !user.buddies.has(args.id)) return;

		user.send('buddy_find', {
			find: buddy.room.data.id,
			igloo: buddy.room.isIgloo,
			game: buddy.room.isGame,
		});
	}
}
