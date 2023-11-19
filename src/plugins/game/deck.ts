import { User } from '../../classes/user/User';
import { Event } from '../../decorators/event';
import { IGamePlugin } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

export default class DeckPlugin extends GamePlugin implements IGamePlugin
{
	name = 'Deck';
	starterDeckId = constants.STARTER_DECK_ID;
	starterDeck = this.world.crumbs.items[this.starterDeckId];

	@Event('add_starter_deck')
	addStarterDeck(args: unknown, user: User)
	{
		if (!this.starterDeck || user.inventory.has(this.starterDeckId)) return;

		const deck = this.world.crumbs.decks[this.starterDeckId];
		if (!deck) return;

		deck.forEach((cardId) =>
		{
			if (this.world.crumbs.cards[cardId]?.powerId === 0) user.cards.add(cardId);
		});

		const powerCards = deck.filter((card) => this.world.crumbs.cards[card] !== undefined && this.world.crumbs.cards[card]!.powerId > 0);
		const randomPowerCard = powerCards[Math.floor(Math.random() * powerCards.length)];
		if (!randomPowerCard) return;

		user.cards.add(randomPowerCard);

		user.inventory.add(this.starterDeckId);
		user.send('add_item', {
			item: this.starterDeckId,
			name: this.starterDeck.name,
			slot: 'award',
			coins: user.data.coins,
		});
	}
}
