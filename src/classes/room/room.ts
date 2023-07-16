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
		user.room.id = this.data.id;

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { id, ...userRoomData } = user.room;

		this.users.set(user.socket.id, {
			...user.getSafe(),
			...userRoomData,
		});

		user.socket.join(this.socketRoom);

		user.send('join_room', {
			room: this.data.id,
			users: this.userValues,
		});
	};

	remove = (user: User) =>
	{
		user.room.id = -1;
		user.socket.leave(this.socketRoom);
		this.users.delete(user.socket.id);
	};

	send = (user: User, message: IActionMessage) =>
	{
		user.sendRoom(this.socketRoom, message.action, message.args);
	};
}
