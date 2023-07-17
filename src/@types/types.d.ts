type TActionMessageArgs = Record<string, unknown>;

interface IActionMessage
{
	action: string;
	args: TActionMessageArgs;
}

interface ILoginAuth
{
	username: string;
	password: string;
	method: 'password' | 'token';
}

interface IGameAuth
{
	username: string;
	key: string;
	createToken?: boolean;
	token?: string;
}

interface IGamePlugin
{
	pluginName: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	events: Record<string, (args: TActionMessageArgs, user: any) => void>;
	schemas: Map<string, ValidateFunction<unknown>>;
}

interface IRoomData
{
	id: number;
	name: string;
	member: boolean;
	maxUsers: number;
	game: boolean;
	spawn: boolean;
}

interface IUserSafeRoom
{
	id: number;
	username: string;
	joinTime: string;
	head: number;
	face: number;
	neck: number;
	body: number;
	hand: number;
	feet: number;
	color: number;
	photo: number;
	flag: number;
	x: number;
	y: number;
	frame: number;
}

type TUserSafe = Omit<IUserSafeRoom, 'x', 'y', 'frame'>;
