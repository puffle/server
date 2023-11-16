import cards from '../../../../data/cards.json';
import { ICard, ICrumbs } from '../../../../types/crumbs';

export interface ICardData extends Omit<ICard, 'name' | 'setId'>
{
	id: number;
	originalElement: ICard['element'];
}

export class Card
{
	constructor(id: number)
	{
		const card = (cards as ICrumbs['cards'])[id];

		this.data = {
			id,
			powerId: card!.powerId,
			element: card!.element,
			color: card!.color,
			value: card!.value,
			originalElement: card!.element,
		};
	}

	data: ICardData;

	toJSON()
	{
		return {
			id: this.data.id,
			powerId: this.data.powerId,
			element: this.data.element,
			color: this.data.color,
			value: this.data.value,
		};
	}
}
