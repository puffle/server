import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { Moderator } from '../../decorators/moderator';
import { Database } from '../../managers/DatabaseManager';
import { IGamePlugin, IntNumberRange, Validate } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IKickBanPlayerArgs { id: number & IntNumberRange<[0, typeof constants.limits.sql.MAX_UNSIGNED_INTEGER]>; }

export default class ModerationPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Moderation';

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
	banPlayer(args: Validate<IKickBanPlayerArgs>, user: User)
	{
		if (user.data.id === args.id) return;

		const recipient = this.world.users.get(args.id);
		if (recipient === undefined || user.data.rank <= recipient.data.rank) return;

		ModerationPlugin.applyBan(user.data.id, args.id);

		recipient.close();
	}

	static async applyBan(moderatorId: number, userId: number, hours?: number, message?: string)
	{
		const expires = new Date(Date.now() + ((hours || 24) * 60 * 60 * 1000));

		// 5th ban is a permanent ban
		const count = await Database.ban.count({ where: { userId } });
		if (count >= 4) await Database.user.update({ where: { id: userId }, data: { permaBan: true } });

		await Database.ban.create({
			data: {
				userId,
				moderatorId,
				expires,
				message: message ?? null,
			},
		});
	}
}
