import { GameWorld } from '../../classes/GameWorld';
import { SenseiInstance } from '../../classes/instance/card/SenseiInstance';
import { User } from '../../classes/user/User';
import { IGamePlugin } from '../../types/types';
import { GamePlugin } from '../GamePlugin';

export default class SenseiPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Sensei';
	senseiRoom = 951;

	constructor(world: GameWorld)
	{
		super(world);

		this.events = {
			join_sensei: this.joinSensei,
		};
	}

	joinSensei = (args: unknown, user: User) =>
	{
		if (user.room?.data.id !== this.senseiRoom || !user.cards.hasCards) return;

		(new SenseiInstance(user)).init();
	};
}
