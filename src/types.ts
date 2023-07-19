import { ValidateFunction } from 'ajv';
import { User } from './classes/user';

export type TActionMessageArgs = Record<string, unknown>;

export interface IActionMessage
{
	action: string;
	args: TActionMessageArgs;
}

export interface ILoginAuth
{
	username: string;
	password: string;
	method: 'password' | 'token';
}

export interface IGameAuth
{
	username: string;
	key: string;
	createToken?: boolean;
	token?: string;
}

export interface IGamePlugin
{
	pluginName: string;
	events: Record<string, (args: TActionMessageArgs, user: User) => void>;
	schemas: Map<string, ValidateFunction<unknown>>;
}

export interface IUserSafeRoom
{
	id: number;
	username: string;
	joinTime: Date;
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

export type TUserSafe = Omit<IUserSafeRoom, 'x' | 'y' | 'frame'>;
export type TUserAnonymous = Omit<TUserSafe, 'joinTime'>;

export interface ICrumbs
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

export type TRoomData = ICrumbs['rooms'][0];
