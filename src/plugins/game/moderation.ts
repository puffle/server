import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { Moderator } from '../../decorators/moderator';
import { Database } from '../../managers/DatabaseManager';
import { Validate } from '../../types/types';
import type { IGamePlugin, IntNumberRange } from '../../types/types';
import type { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IKickBanPlayerArgs { id: number & IntNumberRange<[0, typeof constants.limits.sql.MAX_UNSIGNED_INTEGER]>; }

export default class ModerationPlugin extends GamePlugin implements IGamePlugin
{
	name = 'Moderation';

	@Event('mute_player')
	@Moderator
	mutePlayer(args: unknown, user: User)
	{
		user.send('error', { error: 'Not implemented' }); // TODO: implement; add ts-runtime-checks
	}

	@Event('kick_player')
	@Moderator
	kickPlayer(args: Validate<IKickBanPlayerArgs>, user: User)
	{
		if (user.data.id === args.id) return;

		const recipient = this.world.users.get(args.id);
		if (recipient === undefined || user.data.rank <= recipient.data.rank) return;

		recipient.close();
	}

	@Event('ban_player')
	@Moderator
	async banPlayer(args: Validate<IKickBanPlayerArgs>, user: User)
	{
		if (user.data.id === args.id) return;

		const recipient = this.world.users.get(args.id);
		if (recipient === undefined || user.data.rank <= recipient.data.rank) return;

		await Database.banUser(user.data.id, args.id);

		recipient.close();
	}
}
