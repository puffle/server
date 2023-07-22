import { JSONSchemaType, ValidateFunction } from 'ajv';
import { GameWorld } from '../../classes/GameWorld';
import { User } from '../../classes/User';
import { MyAjv } from '../../managers/AjvManager';
import { Database } from '../../managers/DatabaseManager';
import { IGamePlugin } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface IKickBanPlayerArgs { id: number; }

export default class ModerationPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Moderation';

	constructor(world: GameWorld)
	{
		super(world);

		this.events = {
			mute_player: this.mutePlayer,
			kick_player: this.kickPlayer,
			ban_player: this.banPlayer,
		};

		this.schemas = new Map<string, ValidateFunction<unknown>>([
			['kickBanPlayer', MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['id'],
				properties: {
					id: { type: 'integer', minimum: 0, maximum: constants.limits.sql.MAX_UNSIGNED_INTEGER },
				},
			} as JSONSchemaType<IKickBanPlayerArgs>)],
		]);
	}

	// eslint-disable-next-line class-methods-use-this
	mutePlayer = (args: unknown, user: User) => user.isModerator && user.send('error', { error: 'Not implemented' }); // TODO: implement; add ajv

	kickPlayer = (args: IKickBanPlayerArgs, user: User) =>
	{
		if (!user.isModerator) return;
		if (!this.schemas.get('kickBanPlayer')!(args)) return;
		if (user.data.id === args.id) return;

		const recipient = this.world.users.get(args.id);
		if (recipient === undefined || user.data.rank <= recipient.data.rank) return;

		recipient.close();
	};
	banPlayer = (args: IKickBanPlayerArgs, user: User) =>
	{
		if (!user.isModerator) return;
		if (!this.schemas.get('kickBanPlayer')!(args)) return;
		if (user.data.id === args.id) return;

		const recipient = this.world.users.get(args.id);
		if (recipient === undefined || user.data.rank <= recipient.data.rank) return;

		this.applyBan(user.data.id, args.id);

		recipient.close();
	};

	// eslint-disable-next-line class-methods-use-this
	applyBan = async (moderatorId: number, userId: number, hours?: number, message?: string) =>
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
	};
}
