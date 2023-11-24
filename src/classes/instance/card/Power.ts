import type { ICard } from '../../../types/crumbs';

export class Power
{
	constructor(seat: number, card: ICard)
	{
		this.seat = seat;
		this.card = card;

		this.id = card.powerId;
	}

	seat: number;
	card: ICard;
	id: number;
}
