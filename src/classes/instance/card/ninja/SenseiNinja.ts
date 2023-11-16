import { CustomError } from '@n0bodysec/ts-utils';
import { Card } from './Card';
import { Ninja } from './Ninja';

export class SenseiNinja extends Ninja
{
	/**
	 *
	 * @override
	 * @deprecated use dealCardsSensei() instead
	 */
	// eslint-disable-next-line class-methods-use-this
	override dealCards(dealPowers = true): Card[]
	{
		throw new CustomError(`dealCards(${dealPowers}) is not a valid method in SenseiNinja. Use dealCardsSensei(${dealPowers}) instead.`);
	}

	// TODO
}
