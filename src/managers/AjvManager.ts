import Ajv from 'ajv';
import { actionMessageSchema } from '../utils/schemas/actionMessage';
import { gameAuthSchema } from '../utils/schemas/gameAuth';
import { loginAuthSchema } from '../utils/schemas/loginAuth';

export class AjvManager extends Ajv
{
	/*
	constructor(opts?: Options)
	{
		super(opts);
		// ajvKeywords(this);
	}
	*/

	validators = {
		loginAuth: this.compile(loginAuthSchema),
		gameAuth: this.compile(gameAuthSchema),
		actionMessage: this.compile(actionMessageSchema),
	};
}
