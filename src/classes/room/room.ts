import { User } from '../user';

export class Room
{
	constructor(data: TRoomData)
	{
		this.data = data;
		this.users = new Map();
		this.socketRoom = 'room' + this.data.id;
	}

	data: TRoomData;
	users: Map<number, IUserSafeRoom>;
	socketRoom: string;

	get userValues()
	{
		return [...this.users.values()];
	}

	get isFull()
	{
		return this.users.size >= this.data.maxUsers;
	}

	add = (user: User) =>
	{
		user.room = this;
		this.users.set(user.dbUser.id, user.getSafeRoom);
		user.socket.join(this.socketRoom);

		if (this.data.game)
		{
			user.send('join_game_room', { game: this.data.id });
			return;
		}

		user.send('join_room', {
			room: this.data.id,
			users: this.userValues,
		});

		this.send(user, 'add_player', { user: user.getSafeRoom });
	};

	remove = (user: User) =>
	{
		user.room = undefined;
		user.socket.leave(this.socketRoom);

		if (!this.data.game) this.send(user, 'remove_player', { user: user.dbUser.id });
		this.users.delete(user.dbUser.id);
	};

	// TODO: restore original methods
	send = (user: User, action: string, args: TActionMessageArgs) =>
	{
		user.sendSocketRoom(this.socketRoom, action, args);
	};
}
