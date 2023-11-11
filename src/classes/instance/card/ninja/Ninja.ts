import { CustomError } from '@n0bodysec/ts-utils';
import cards from '../../../../data/cards.json';
import { ICard, ICrumbs } from '../../../../types/crumbs';
import { User } from '../../../user/User';
import { Card } from './Card';

export class Ninja
{
	user: User | undefined;
	opponent?: this;
	deck: number[] = [];
	dealt?: Card[];
	pick: Card | null = null;
	dealtSize = 5;
	hasDealt = false;
	wins = {
		f: [],
		w: [],
		s: [],
	};

	constructor(user?: User)
	{
		this.user = user;

		if (this.user) this.setDeck();
	}

	setDeck = () =>
	{
		if (this.user?.cards.deck === undefined) throw new CustomError('Invalid user\'s deck data provided');

		// shallow copy
		this.deck = Array.from(this.user?.cards.deck);
	};

	filterDeckRegularCards = () =>
	{
		if (this.deck === undefined) return;
		this.deck = this.deck.filter((card) => (cards as ICrumbs['cards'])[card]?.powerId === 0);
	};

	isInDealt = (cardId: number) => this.dealt?.some((dealt) => dealt.data.id === cardId);
	hasPlayableCards = (element: ICard['element']) => Boolean(this.getLimitedDealt(element)?.length);
	getLimitedDealt = (element: ICard['element']) => this.dealt?.filter((dealt) => dealt.data.element !== element);

	dealCards = (dealPowers = true) =>
	{
		if (this.dealt === undefined) throw new CustomError('`dealt` field is undefined');

		this.hasDealt = true;

		if (!dealPowers) this.filterDeckRegularCards();

		const currentDealt = [];
		const dealNumber = this.dealtSize - this.dealt.length;

		for (let i = 0; i < dealNumber; i++)
		{
			const deal = this.dealCard();
			if (deal === undefined) throw new CustomError('`deal` field is undefined');

			const card = new Card(deal);

			currentDealt.push(card);
			this.dealt.push(card);
		}

		return currentDealt;
	};

	dealCard = () =>
	{
		if (this.deck.length < 1) this.setDeck();

		const randomIndex = Math.floor(Math.random() * this.deck.length);
		const randomCard = this.deck[randomIndex];

		this.deck?.splice(randomIndex, 1);

		return randomCard;
	};

	pickCard = (cardId: number) =>
	{
		if (this.opponent === undefined) throw new CustomError('Cannot find a valid opponent');

		this.pick = this.getPick(cardId) || null;
		if (this.pick == null) throw new CustomError('`pick` field is null');

		const card = this.dealt?.indexOf(this.pick);
		if (card === undefined) throw new CustomError('`card` field is undefined');

		this.opponent.send('pick_card', { card });
		this.dealt?.splice(card, 1);
	};

	getPick = (id: number) => this.dealt?.find((card) => card.data.id === id);

	revealCards = () =>
	{
		if (this.opponent === undefined) throw new CustomError('Cannot find a valid opponent');

		this.send('reveal_card', { card: this.opponent.pick });
		this.opponent.send('reveal_card', { card: this.pick });
	};

	resetTurn = () =>
	{
		this.pick = null;
		this.hasDealt = false;
	};

	send = (action: string, args = {}) => this.user?.send(action, args);
}
