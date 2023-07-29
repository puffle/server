import { ValidateFunction } from 'ajv';
import { User } from '../classes/User';
import { constants } from '../utils/constants';
import { IRoom } from './crumbs';

/**
 * Object.values() at type level
 */
export type ValuesOf<T> = T[keyof T];

/**
 * Get all keys where the values are of type TCondition
 */
export type KeysOfType<TObj, TCondition> = ValuesOf<{
	[K in keyof TObj]: TObj[K] extends TCondition ? K : never;
}>;

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
	schemas: Record<string, ValidateFunction<unknown>>;
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

export type TItemSlots = typeof constants.ITEM_SLOTS[number];
