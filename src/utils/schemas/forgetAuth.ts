import { JSONSchemaType } from 'ajv';
import { TForgetAuth } from '../../types/types';
import { loginAuthSchema } from './loginAuth';

export const forgetAuthSchema: JSONSchemaType<TForgetAuth> = {
	type: 'object',
	additionalProperties: false,
	required: ['username', 'password'],
	properties: {
		username: loginAuthSchema.properties.username,
		password: loginAuthSchema.properties.password,
	},
};
