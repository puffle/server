import { JSONSchemaType } from 'ajv';
import { IGameAuth } from '../../types/types';

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
	},
};
