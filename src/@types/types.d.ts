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
type TUserAnonymous = Omit<TUserSafe, 'joinTime'>;

interface ICrumbs
{
	floorings: {
		[id: number]: {
			name: string;
			cost: number;
			patched: number;
		};
	};

	furnitures: {
		[id: number]: {
			name: string;
			type: number;
			sort: number;
			cost: number;
			member: number;
			bait: number;
			patched: number;
			max: number;
			fps?: number;
		};
	};

	igloos: {
		[id: number]: {
			name: string;
			cost: number;
			patched: number;
		};
	};

	items: {
		[id: number]: {
			name: string;
			type: number;
			cost: number;
			member: number;
			bait: number;
			patched: number;
			treasure: number;
		};
	};

	rooms: {
		id: number;
		name: string;
		member: number;
		maxUsers: number;
		game: number;
		spawn: number;
	}[];

	tables: {
		id: number;
		roomId: number;
		game: string;
	}[];

	waddles: {
		id: number;
		roomId: number;
		seats: number;
		game: string;
	}[];

}

type TRoomData = ICrumbs['rooms'][0];
