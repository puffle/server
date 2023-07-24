import { JSONSchemaType } from 'ajv';

interface IRegisterAccount
{
	username: string;
	password: string;
	email: string;
	color: number;
}

export const registerAccountSchema: JSONSchemaType<IRegisterAccount> = {
	type: 'object',
	additionalProperties: false,
	required: ['username', 'password', 'email', 'color'],
	properties: {
		username: {
			type: 'string',
			transform: ['trim'],
			minLength: 4,
			maxLength: 12,
		},
		password: {
			type: 'string',
			transform: ['trim'],
			minLength: 3,
			maxLength: 128,
		},
		email: { // TODO: add email format
			type: 'string',
			transform: ['trim'],
			minLength: 3,
			maxLength: 50,
		},
		color: {
			type: 'integer',
			colorValidator: true,
		},
	},
};
