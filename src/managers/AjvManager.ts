import Ajv from 'ajv';
import { actionMessageSchema } from '../utils/schemas/actionMessage';
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
		actionMessage: this.compile(actionMessageSchema),
	};
}
