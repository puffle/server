import { User } from '../user';

export class Room
{
	constructor(data: IRoomData)
	{
		this.data = data;
		this.users = new Map();
		this.socketRoom = 'room' + this.data.id;
	}

	data: IRoomData;
	users: Map<string, IUserSafeRoom>;
	socketRoom: string;

	get userValues()
	{
		return Array.from(this.users.values());
	}

	get isFull()
	{
		return this.users.size >= this.data.maxUsers;
	}

	add = (user: User) =>
	{
		user.room = this;

		this.users.set(user.socket.id, {
			...user.getSafeRoom(),
			...user.roomData,
		});

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

		this.send(user, 'add_player', { user: user.getSafeRoom() });
	};

	remove = (user: User) =>
	{
		user.room = undefined;

		if (!this.data.game) this.send(user, 'remove_player', { user: user.dbUser.id });
		user.socket.leave(this.socketRoom);
		this.users.delete(user.socket.id);
	};

	send = (user: User, action: string, args: TActionMessageArgs) =>
	{
		user.sendSocketRoom(this.socketRoom, action, args);
	};
}
