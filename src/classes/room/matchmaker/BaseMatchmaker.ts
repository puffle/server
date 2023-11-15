import { IMatchmaker } from '../../../types/crumbs';
import { User } from '../../user/User';
import { Room } from '../Room';
import { MatchmakerPlayer } from './MatchmakerPlayer';

export abstract class BaseMatchmaker
{
	constructor(data: IMatchmaker, room: Room, maxPlayers: number, matchEvery: number)
	{
		this.data = data;
		this.room = room;
		this.maxPlayers = maxPlayers;
		this.matchEvery = matchEvery;
	}

	data: IMatchmaker;
	room: Room;
	players: Map<number, MatchmakerPlayer> = new Map();
	maxPlayers: number;
	matchEvery: number;

	abstract start: () => void;

	add = (user: User) =>
	{
		this.players.set(user.data.id, new MatchmakerPlayer(user, this.matchEvery));
		user.send('join_matchmaking');
	};

	includes = (user: User) => this.players.has(user.data.id);
	remove = (user: User) => this.players.delete(user.data.id);
}
