import { JSONSchemaType } from 'ajv';

export const actionMessageSchema: JSONSchemaType<IActionMessage> = {
	type: 'object',
	additionalProperties: false,
	required: ['action', 'args'],
	properties: {
		action: {
			type: 'string',
		},
		args: {
			type: 'object',
			// additionalProperties: false,
		},
	},
};
