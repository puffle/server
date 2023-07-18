import { JSONSchemaType, ValidateFunction } from 'ajv';
import { User } from '../../classes/user';
import { GameWorld } from '../../classes/world';
import { MyAjv } from '../../managers/AjvManager';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';

interface ISendMessageArgs { message: string; }
interface ISendSafeArgs { safe: number; }
interface ISendEmoteArgs { emote: number; }

type TCommand = (args: string[], user: User) => void;

export default class ChatPlugin extends GamePlugin implements IGamePlugin
{
	pluginName = 'Chat';

	commands: Map<string, TCommand>;

	constructor(world: GameWorld)
	{
		super(world);

		this.commands = new Map<string, TCommand>([
			['id', this.cmdId],
			['users', this.cmdUsers],
			['room', this.cmdRoom],

			// moderator commands
			['ac', this.cmdCoins],
			['jr', this.cmdJoinRoom],
			['rooms', this.cmdPopulation],
		]);

		this.events = {
			send_message: this.sendMessage,
			send_safe: this.sendSafe,
			send_emote: this.sendEmote,
		};

		this.schemas = new Map<string, ValidateFunction<unknown>>([
			['sendMessage', MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['message'],
				properties: {
					message: {
						type: 'string',
						minLength: 1,
						maxLength: 48,
					},
				},
			} as JSONSchemaType<ISendMessageArgs>)],

			['sendSafe', MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['safe'],
				properties: {
					safe: { type: 'integer', minimum: 0 },
				},
			} as JSONSchemaType<ISendSafeArgs>)],

			['sendEmote', MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['emote'],
				properties: {
					emote: { type: 'integer', minimum: 0 },
				},
			} as JSONSchemaType<ISendEmoteArgs>)],
		]);
	}

	sendMessage = (args: ISendMessageArgs, user: User) =>
	{
		if (!this.schemas.get('sendMessage')!(args)) return;
		if (/[^ -~]/i.test(args.message)) return;
		args.message = args.message.replace(/  +/g, ' ').trim();

		if (args.message.startsWith(constants.COMMANDS_PREFIX))
		{
			this.processCommand(args.message, user);
			return;
		}

		user.sendRoom('send_message', { id: user.dbUser.id, ...args });
	};

	sendSafe = (args: ISendSafeArgs, user: User) => this.schemas.get('sendSafe')!(args) && user.sendRoom('send_safe', { id: user.dbUser.id, ...args });
	sendEmote = (args: ISendEmoteArgs, user: User) => this.schemas.get('sendEmote')!(args) && user.sendRoom('send_emote', { id: user.dbUser.id, ...args });

	processCommand = (message: string, user: User) =>
	{
		const [command, ...args] = message.substring(1).match(/(?:[^\s"]+|"[^"]*")+/g)?.map((x: string) => x.replaceAll(/^"|"$/g, '')) || [];
		if (!command) return;

		const cmd = this.commands.get(command.toLowerCase());
		if (!cmd) return;

		cmd(args, user);
	};

	// commands

	cmdUsers = (args: string[], user: User) => user.send('error', { error: `Users online: ${this.world.population}` });
	cmdId = (args: string[], user: User) => user.send('error', { error: `Your ID: ${user.dbUser.id}` }); // eslint-disable-line class-methods-use-this
	cmdRoom = (args: string[], user: User) => user.send('error', { error: `Room: ${user.room?.data.name} (${user.room?.data.id})\nUsers: ${user.room?.population}` }); // eslint-disable-line class-methods-use-this

	// moderator commands
	cmdCoins = (args: string[], user: User) => // eslint-disable-line class-methods-use-this
	{
		if (!user.isModerator) return;

		const coins = Number(args[0]);
		if (Number.isNaN(coins)) return;

		user.updateCoins(coins, true);
	};

	cmdJoinRoom = (args: string[], user: User) => // eslint-disable-line class-methods-use-this
	{
		if (!user.isModerator) return;

		const roomId = Number(args[0]);
		if (Number.isNaN(roomId)) return;

		user.joinRoom(roomId);
	};

	cmdPopulation = (args: string[], user: User) => // eslint-disable-line class-methods-use-this
	{
		if (!user.isModerator) return;

		const roomArray: [string, number][] = [...this.world.rooms.values()]
			.filter((room) => room.population !== 0)
			.map((room) => [room.data.name, room.population]);

		const formattedString: string = roomArray.map((room) => `${room[0]}: ${room[1]}`).join(', ');

		user.send('error', { error: 'Users\n\n' + formattedString });
	};
}
