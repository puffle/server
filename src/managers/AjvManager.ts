import Ajv from 'ajv';
import ajvKeywords from 'ajv-keywords/dist/definitions';
import { actionMessageSchema } from '../utils/schemas/actionMessage';
import { gameAuthSchema } from '../utils/schemas/gameAuth';
import { loginAuthSchema } from '../utils/schemas/loginAuth';

export class AjvManager extends Ajv
{
	validators = {
		loginAuth: this.compile(loginAuthSchema),
		gameAuth: this.compile(gameAuthSchema),
		actionMessage: this.compile(actionMessageSchema),
	};
}

export const MyAjv = new AjvManager({
	allErrors: true,
	removeAdditional: true,
	keywords: ajvKeywords(),
});
