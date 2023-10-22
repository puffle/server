import { JSONSchemaType } from 'ajv';
import { GameWorld } from '../../classes/GameWorld';
import { User } from '../../classes/User';
import { MyAjv } from '../../managers/AjvManager';
import { Database } from '../../managers/DatabaseManager';
import { IGamePlugin } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IGenericBuddyArgs { id: number; }

export default class BuddyPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Buddy';

	constructor(world: GameWorld)
	{
		super(world);

		this.events = {
			buddy_request: this.buddyRequest,
			buddy_accept: this.buddyAccept,
			buddy_reject: this.buddyReject,
			buddy_remove: this.buddyRemove,
			buddy_find: this.buddyFind,
		};

		this.schemas = {
			genericBuddyId: MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['id'],
				properties: {
					id: { type: 'integer', minimum: 0, maximum: constants.limits.MAX_X },
				},
			} as JSONSchemaType<IGenericBuddyArgs>),
		};
	}

	buddyRequest = (args: IGenericBuddyArgs, user: User) =>
	{
		if (!this.schemas.genericBuddyId!(args)) return;

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
	};

	buddyAccept = async (args: IGenericBuddyArgs, user: User) =>
	{
		if (!this.schemas.genericBuddyId!(args)) return;

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
	};

	buddyReject = (args: IGenericBuddyArgs, user: User) =>
	{
		if (!this.schemas.genericBuddyId!(args)) return;

		user.buddies.deleteRequest(args.id);
	};

	buddyRemove = async (args: IGenericBuddyArgs, user: User) =>
	{
		if (!this.schemas.genericBuddyId!(args)) return;

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
	};

	buddyFind = (args: IGenericBuddyArgs, user: User) =>
	{
		if (!this.schemas.genericBuddyId!(args)) return;

		const buddy = this.world.users.get(args.id);
		if (buddy === undefined || buddy.room === undefined || !user.buddies.has(args.id)) return;

		user.send('buddy_find', {
			find: buddy.room.data.id,
			igloo: buddy.room.isIgloo,
			game: buddy.room.isGame,
		});
	};
}
