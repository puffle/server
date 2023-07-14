import { JSONSchemaType } from 'ajv';

export const gameAuthSchema: JSONSchemaType<IGameAuth> = {
	type: 'object',
	additionalProperties: false,
	required: ['username', 'key'],
	properties: {
		username: {
			type: 'string',
			transform: ['trim'],
			minLength: 4,
			maxLength: 12,
		},
		key: {
			type: 'string',
			transform: ['trim'],
		},
		createToken: {
			type: 'boolean',
			nullable: true,
		},
		token: {
			type: 'string',
			nullable: true,
		},
	},
};
