import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { Database } from '../../managers/DatabaseManager';
import { IGamePlugin, IntNumberRange, Validate } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IGenericIgnoreArgs { id: number & IntNumberRange<[0, typeof constants.limits.sql.MAX_UNSIGNED_INTEGER]>; }

export default class IgnorePlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Ignore';

	@Event('ignore_add')
	async ignoreAdd(args: Validate<IGenericIgnoreArgs>, user: User)
	{
		if (
			args.id === user.data.id
			|| user.buddies.has(args.id)
			|| user.ignores.has(args.id)
		) return;

		const ignore = this.world.users.get(args.id);
		let username: string | undefined;

		if (ignore !== undefined) // user to ignore is online
		{
			username = ignore.data.username;
			ignore.buddies.deleteRequest(user.data.id);
		}
		else // user to ignore is offline
		{
			username = await Database.getUsername(args.id);
		}

		if (username === undefined) return;

		user.buddies.deleteRequest(args.id);
		user.ignores.addIgnore(args.id, username);
	}

	@Event('ignore_remove')
	ignoreRemove(args: Validate<IGenericIgnoreArgs>, user: User)
	{
		if (!user.ignores.has(args.id)) return;

		user.ignores.removeIgnore(args.id);
	}
}
