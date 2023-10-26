import { IWaddle } from '../../types/crumbs';
import { Waddle } from '../room/waddle/Waddle';
import { BaseInstance } from './BaseInstance';
import { SledInstance } from './SledIntance';
import { CardInstance } from './card/CardInstance';

export class InstanceFactory
{
	static types: Record<IWaddle['game'], typeof BaseInstance> = {
		card: CardInstance,
		sled: SledInstance,
	};

	static createInstance = (waddle: Waddle) => new this.types[waddle.data.game](waddle);
}
