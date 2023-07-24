import { ValidateFunction } from 'ajv';
import { User } from '../classes/User';
import { IRoom } from './crumbs';

export type AnyKey = Record<string, unknown>;

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
	createToken: boolean;
}

export interface IGameAuth
{
	username: string;
	key: string;
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

export type IRoomIgloo = Partial<IRoom> & {
	id: number;
	name: string;
};
