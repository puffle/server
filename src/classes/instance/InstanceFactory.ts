import type { Nullable } from '@n0bodysec/ts-utils';
import type { IWaddle } from '../../types/crumbs';
import type { Waddle } from '../room/waddle/Waddle';
import type { User } from '../user/User';
import type { BaseInstance } from './BaseInstance';
import { SledInstance } from './SledIntance';
import { CardInstance } from './card/CardInstance';

export class InstanceFactory
{
	static types: Record<IWaddle['game'], typeof BaseInstance> = {
		card: CardInstance,
		sled: SledInstance,
	};

	static createInstanceEx(options: { game: IWaddle['game'], users: Nullable<User>[], waddle?: Waddle; })
	{
		return new this.types[options.game](options.users, options.waddle);
	}

	static createInstance(waddle: Waddle)
	{
		return this.createInstanceEx({
			game: waddle.data.game,
			users: waddle.users,
			waddle,
		});
	}
}
