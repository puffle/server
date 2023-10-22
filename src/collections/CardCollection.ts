import { Database } from '../managers/DatabaseManager';
import { Collection } from './Collection';

export class CardCollection extends Collection
{
	starterDeckId = 821;

	get collection() { return this.user.data.cards; }
	has = (value: number) => this.collection.some((x) => x.cardId === value);

	// owned cards * their quantities
	get deck()
	{
		const deck: number[] = [];
		this.collection.forEach((card) => deck.push(...Array.from({ length: card.quantity }, () => card.cardId)));

		return deck;
	}

	get hasCards()
	{
		const hasStarterDeck = this.user.inventory.collection.some((x) => x.itemId === this.starterDeckId);
		const hasCards = this.collection.length > 0;

		return hasStarterDeck && hasCards;
	}

	add = async (cardId: number, quantity = 1) =>
	{
		const card = this.collection.find((x) => x.cardId === cardId);

		if (card !== undefined) // the cardId exists in the user's card collection
		{
			await Database.card.updateMany({
				where: {
					userId: this.user.data.id,
					cardId,
				},
				data: {
					quantity: {
						increment: quantity,
					},
				},
			});

			card.quantity += quantity;
		}
		else // if the cardId does not exist in the user's card collection
		{
			const newData = {
				userId: this.user.data.id,
				cardId,
				quantity,
				memberQuantity: 0,
			};

			await Database.card.create({ data: newData });
			this.collection.push(newData);
		}
	};

	toJSON()
	{
		return Object.values(this.collection).map((card) => this.cardToJSON(card.cardId));
	}

	cardToJSON = (cardId: number) =>
	{
		const cardCrumb = this.user.world.crumbs.cards[cardId];
		if (cardCrumb === undefined) return undefined;

		const card = this.collection.find((c) => c.cardId === cardId && c.quantity > 0);
		if (card === undefined) return undefined;

		return {
			id: cardId,
			powerId: cardCrumb.powerId,
			element: cardCrumb.element,
			color: cardCrumb.color,
			value: cardCrumb.value,
			quantity: card.quantity,
		};
	};
}
