import { JSONSchemaType } from 'ajv';
import { GameWorld } from '../../classes/GameWorld';
import { User } from '../../classes/user/User';
import { MyAjv } from '../../managers/AjvManager';
import { IGamePlugin } from '../../types/types';
import { constants } from '../../utils/constants';
import { GamePlugin } from '../GamePlugin';
import IglooPlugin from './Igloo';
import ItemPlugin from './Item';

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
			['ai', this.cmdItems],
			['ac', this.cmdCoins],
			['af', this.cmdFurniture],
			['aig', this.cmdIgloo],
			['jr', this.cmdJoinRoom],
			['rooms', this.cmdPopulation],
			['bc', this.cmdBroadcast],
			['rbc', this.cmdBroadcastRoom],
			['ajc', this.cmdJitsuCard],
			['aja', this.cmdAllJitsuCards],
		]);

		this.events = {
			send_message: this.sendMessage,
			send_safe: this.sendSafe,
			send_emote: this.sendEmote,
		};

		this.schemas = {
			sendMessage: MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['message'],
				properties: {
					message: { type: 'string', minLength: 1, maxLength: 48 },
				},
			} as JSONSchemaType<ISendMessageArgs>),

			sendSafe: MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['safe'],
				properties: {
					safe: { type: 'integer', minimum: 0, maximum: constants.limits.sql.MAX_UNSIGNED_INTEGER },
				},
			} as JSONSchemaType<ISendSafeArgs>),

			sendEmote: MyAjv.compile({
				type: 'object',
				additionalProperties: false,
				required: ['emote'],
				properties: {
					emote: { type: 'integer', minimum: 0, maximum: constants.limits.sql.MAX_UNSIGNED_INTEGER },
				},
			} as JSONSchemaType<ISendEmoteArgs>),
		};
	}

	sendMessage = (args: ISendMessageArgs, user: User) =>
	{
		if (!this.schemas.sendMessage!(args)) return;
		if (/[^ -~]/i.test(args.message)) return;
		args.message = args.message.replace(/  +/g, ' ').trim();

		if (args.message.startsWith(constants.COMMANDS_PREFIX))
		{
			this.processCommand(args.message, user);
			return;
		}

		user.room?.send(user, 'send_message', { id: user.data.id, ...args }, [user], true);
	};

	sendSafe = (args: ISendSafeArgs, user: User) => this.schemas.sendSafe!(args) && user.room?.send(user, 'send_safe', { id: user.data.id, ...args }, [user], true);
	sendEmote = (args: ISendEmoteArgs, user: User) => this.schemas.sendEmote!(args) && user.room?.send(user, 'send_emote', { id: user.data.id, ...args }, [user], true);

	processCommand = (message: string, user: User) =>
	{
		const [command, ...args] = message.substring(1).split(' ');
		if (!command) return;

		const cmd = this.commands.get(command.toLowerCase());
		if (!cmd) return;

		cmd(args, user);
	};

	// commands

	cmdUsers = (args: string[], user: User) => user.send('error', { error: `Users online: ${this.world.population}` });
	cmdId = (args: string[], user: User) => user.send('error', { error: `Your ID: ${user.data.id}` }); // eslint-disable-line class-methods-use-this
	cmdRoom = (args: string[], user: User) => user.send('error', { error: `Room: ${user.room?.data.name} (${user.room?.data.id})\nUsers: ${user.room?.population}` }); // eslint-disable-line class-methods-use-this

	// moderator commands
	cmdCoins = (args: string[], user: User) => // eslint-disable-line class-methods-use-this
	{
		if (!user.isModerator) return;

		const coins = Number(args[0]);
		if (Number.isNaN(coins)) return;

		user.updateCoins(coins, true);
	};

	cmdJoinRoom = (args: string[], user: User) =>
	{
		if (!user.isModerator) return;

		const roomId = Number(args[0]);
		if (Number.isNaN(roomId))
		{
			// if NaN, then the room arg is a string, so we use room name
			const room = [...this.world.rooms.values()].find((r) => !r.isIgloo && r.data.name === args[0]);
			if (room !== undefined) user.joinRoom(room.data.id);

			return;
		}

		user.joinRoom(roomId);
	};

	cmdPopulation = (args: string[], user: User) =>
	{
		if (!user.isModerator) return;

		const roomArray: [string, number][] = [...this.world.rooms.values()]
			.filter((room) => room.population !== 0)
			.map((room) => [room.data.name, room.population]);

		const formattedString: string = roomArray.map((room) => `${room[0]}: ${room[1]}`).join(', ');

		user.send('error', { error: 'Users\n\n' + formattedString });
	};

	cmdBroadcast = (args: string[], user: User) => user.isModerator
		&& this.world.server.to(constants.JOINEDUSERS_ROOM).emit('message', { action: 'error', args: { error: 'Broadcast:\n\n' + args.join(' ') } });

	cmdBroadcastRoom = (args: string[], user: User) => user.isModerator
		&& user.room !== undefined
		&& this.world.server.to(user.room.socketRoom).emit('message', { action: 'error', args: { error: 'Broadcast (Current Room):\n\n' + args.join(' ') } });

	cmdItems = (args: string[], user: User) =>
	{
		if (!user.isModerator) return;

		const item = Number(args[0]);
		if (Number.isNaN(item)) return;

		const plugin = this.world.pluginManager.plugins.Item;
		if (plugin === undefined) return;

		(plugin as ItemPlugin).addItem({ item }, user);
	};

	cmdFurniture = (args: string[], user: User) =>
	{
		if (!user.isModerator) return;

		const furniture = Number(args[0]);
		if (Number.isNaN(furniture)) return;

		const plugin = this.world.pluginManager.plugins.Igloo;
		if (plugin === undefined) return;

		(plugin as IglooPlugin).addFurniture({ furniture }, user);
	};

	cmdIgloo = (args: string[], user: User) =>
	{
		if (!user.isModerator) return;

		const igloo = Number(args[0]);
		if (Number.isNaN(igloo)) return;

		const plugin = this.world.pluginManager.plugins.Igloo;
		if (plugin === undefined) return;

		(plugin as IglooPlugin).addIgloo({ igloo }, user);
	};

	cmdJitsuCard = (args: string[], user: User) =>
	{
		if (!user.isModerator) return;

		const cardId = Number(args[0]);
		const card = this.world.crumbs.cards[cardId];
		if (card === undefined)
		{
			user.send('error', { error: 'Card not found!' });
			return;
		}

		user.cards.add(cardId);
		user.send('error', { error: `Adding card: ${card.name}` });
	};

	cmdAllJitsuCards = (args: string[], user: User) =>
	{
		if (!user.isModerator) return;
		Object.keys(this.world.crumbs.cards).forEach((card) => user.cards.add(Number(card)));

		user.send('error', { error: 'Adding all cards...' });
	};
}
