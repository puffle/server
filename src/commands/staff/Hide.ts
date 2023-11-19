import { User } from '../../classes/user/User';
import { IGameCommand } from '../../types/types';
import { constants } from '../../utils/constants';
import { GameCommand } from '../GameCommand';

export default class Command extends GameCommand implements IGameCommand
{
	name = 'hide';
	override rank = 1;

	override onCall(args: string[], user: User): void
	{
		if (!user.room) return;

		user.isHidden = !user.isHidden;

		// do not send remove_player to staffs
		const ignoredUsers = [user, user.room.userValuesUnsafe.filter((u) => u.data.rank >= constants.FIRST_MODERATOR_RANK)].flat();
		user.room.send(user, 'remove_player', { user: user.data.id }, ignoredUsers);

		user.room.send(user, 'update_player', {
			id: user.data.id,
			attributes: user.isHidden ? { speed: constants.HIDDEN_PENGUIN_SPEED, alpha: constants.HIDDEN_PENGUIN_ALPHA } : { speed: 0, alpha: 1 },
		}, []);

		user.send('error', { error: user.isHidden ? 'You are now hidden!\nOther staffs are still able to see you' : 'You are not longer hidden!\nAll players are able to see you' });
	}
}
