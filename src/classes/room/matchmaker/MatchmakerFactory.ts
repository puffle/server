import type { IMatchmaker } from '../../../types/crumbs';
import type { Room } from '../Room';
import { CardMatchmaker } from './card/CardMatchmaker';

type TMatchmakers = typeof CardMatchmaker;
export class MatchmakerFactory
{
	static types: Record<IMatchmaker['game'], TMatchmakers> = {
		card: CardMatchmaker,
	};

	static createMatchmaker(matchmaker: IMatchmaker, room: Room) { return new this.types[matchmaker.game](matchmaker, room); }
}
