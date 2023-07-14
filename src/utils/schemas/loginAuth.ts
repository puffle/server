import { JSONSchemaType } from 'ajv';

export const loginAuthSchema: JSONSchemaType<ILoginAuth> = {
	type: 'object',
	additionalProperties: false,
	required: ['username', 'password', 'method'],
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
		method: {
			type: 'string',
			enum: ['password', 'token'],
		},
	},
};
