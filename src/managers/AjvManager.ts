import Ajv, { Options } from 'ajv';
import ajvKeywords from 'ajv-keywords/dist/definitions';
import { actionMessageSchema } from '../utils/schemas/actionMessage';
import { forgetAuthSchema } from '../utils/schemas/forgetAuth';
import { gameAuthSchema } from '../utils/schemas/gameAuth';
import { loginAuthSchema } from '../utils/schemas/loginAuth';
import { registerAccountSchema } from '../utils/schemas/registerAccount';

export class AjvManager extends Ajv
{
	constructor(opts?: Options | undefined)
	{
		super(opts);

		this.addKeyword({
			keyword: 'colorValidator',
			type: 'integer',
			schemaType: 'boolean',
			compile: () => (data) => (data >= 1 && data <= 16 && data !== 14),
		});

		this.validators = {
			registerAccount: this.compile(registerAccountSchema),
			loginAuth: this.compile(loginAuthSchema),
			gameAuth: this.compile(gameAuthSchema),
			forgetAuth: this.compile(forgetAuthSchema),
			actionMessage: this.compile(actionMessageSchema),
		};
	}

	validators;
	initialized = false;

	initialize = () => { this.initialized = true; };
}

export const MyAjv = new AjvManager({
	allErrors: true,
	removeAdditional: true,
	keywords: ajvKeywords(),
});
