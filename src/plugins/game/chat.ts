import { JSONSchemaType, ValidateFunction } from 'ajv';
import { User } from '../../classes/user';
import { GameWorld } from '../../classes/world';
import { GamePlugin } from '../GamePlugin';

interface ISendMessageArgs { message: string; }
interface ISendSafeArgs { safe: number; }
interface ISendEmoteArgs { emote: number; }

export default class ChatPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Chat';

	constructor(world: GameWorld)
	{
		super(world);

		this.events = {
			send_message: this.sendMessage,
			send_safe: this.sendSafe,
			send_emote: this.sendEmote,
		};

		this.schemas = new Map<string, ValidateFunction<unknown>>([
			['sendMessage', this.world.ajv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['message'],
				properties: {
					message: {
						type: 'string',
						minLength: 1,
						maxLength: 48,
						// pattern: '/[^ -~]/i',
					},
				},
			} as JSONSchemaType<ISendMessageArgs>)],

			['sendSafe', this.world.ajv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['safe'],
				properties: {
					safe: { type: 'integer', minimum: 0 },
				},
			} as JSONSchemaType<ISendSafeArgs>)],

			['sendEmote', this.world.ajv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['emote'],
				properties: {
					emote: { type: 'integer', minimum: 0 },
				},
			} as JSONSchemaType<ISendEmoteArgs>)],
		]);
	}

	// TODO: add all checks & commands
	sendMessage = (args: ISendMessageArgs, user: User) => this.schemas.get('sendMessage')!(args) && user.sendRoom('send_message', { id: user.dbUser.id, ...args });
	sendSafe = (args: ISendSafeArgs, user: User) => this.schemas.get('sendSafe')!(args) && user.sendRoom('send_safe', { id: user.dbUser.id, ...args });
	sendEmote = (args: ISendEmoteArgs, user: User) => this.schemas.get('sendEmote')!(args) && user.sendRoom('send_emote', { id: user.dbUser.id, ...args });
}
