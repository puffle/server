import { IWaddle } from '../../types/crumbs';
import { Waddle } from '../room/waddle/Waddle';
import { User } from '../user/User';
import { BaseInstance } from './BaseInstance';
import { SledInstance } from './SledIntance';
import { CardInstance } from './card/CardInstance';

export class InstanceFactory
{
	static types: Record<IWaddle['game'], typeof BaseInstance> = {
		card: CardInstance,
		sled: SledInstance,
	};

	static createInstanceEx = (options: {
		game: IWaddle['game'],
		users: User[],
		waddle?: Waddle,
	}) => new this.types[options.game](options.users, options.waddle);

	static createInstance = (waddle: Waddle) => this.createInstanceEx({
		game: waddle.data.game,
		users: waddle.users,
		waddle,
	});
}
