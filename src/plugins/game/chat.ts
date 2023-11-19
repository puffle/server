import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { IGamePlugin, IntNumberRange, LenRange, Validate } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface ISendMessageArgs { message: string & LenRange<[1, 48]>; }
interface ISendSafeArgs { safe: number & IntNumberRange<[0, typeof constants.limits.sql.MAX_UNSIGNED_INTEGER]>; }
interface ISendEmoteArgs { emote: number & IntNumberRange<[0, typeof constants.limits.sql.MAX_UNSIGNED_INTEGER]>; }

export default class ChatPlugin extends GamePlugin implements IGamePlugin
{
	name = 'Chat';

	@Event('send_message')
	sendMessage(args: Validate<ISendMessageArgs>, user: User)
	{
		if (/[^ -~]/i.test(args.message)) return;
		args.message = args.message.replace(/  +/g, ' ').trim();

		if (args.message.startsWith(constants.COMMANDS_PREFIX))
		{
			this.world.commandManager.processCommand(args.message, user);
			return;
		}

		user.room?.send(user, 'send_message', { id: user.data.id, ...args }, [user], true);
	}

	@Event('send_safe')
	sendSafe(args: Validate<ISendSafeArgs>, user: User)
	{
		user.room?.send(user, 'send_safe', { id: user.data.id, ...args }, [user], true);
	}

	@Event('send_emote')
	sendEmote(args: Validate<ISendEmoteArgs>, user: User)
	{
		user.room?.send(user, 'send_emote', { id: user.data.id, ...args }, [user], true);
	}
}
