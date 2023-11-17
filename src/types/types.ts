import { Assert, ExactProps, Int, Max, MaxLen, Min, MinLen } from 'ts-runtime-checks';
import { constants } from '../utils/constants';
import { IRoom } from './crumbs';

// ts-runtime-checks
export type Validate<T, ReturnValue = undefined> = Assert<T, ReturnValue>;
export type ValidateExact<T extends object, ReturnValue = undefined> = Assert<ExactProps<T, true, true>, ReturnValue>;
export type IntNumberRange<T extends number[]> = Int & Min<T[0]> & Max<T[1]>;
export type LenRange<T extends number[]> = MinLen<T[0]> & MaxLen<T[1]>;

export type TActionMessageArgs = Record<string, unknown>;

export interface IActionMessage
{
	action: string;
	args: TActionMessageArgs;
}

export interface IForgetAuth
{
	username: string & LenRange<[typeof constants.limits.MIN_USERNAME_LEN, typeof constants.limits.MAX_USERNAME_LEN]>;
	password: string & LenRange<[typeof constants.limits.MIN_PASSWORD_LEN, typeof constants.limits.MAX_PASSWORD_LEN]>;
}

export interface ILoginAuth extends IForgetAuth
{
	method: 'password' | 'token';
	createToken: boolean;
}

export interface IRegisterAccount extends IForgetAuth
{
	email: string; // TODO: validate email regex
	color: number; // TODO: validate color : (color >= 1 && color <= 16 && color !== 14)
}

export interface IGameAuth extends Omit<IForgetAuth, 'password'>
{
	key: string;
}

export interface IGamePlugin
{
	pluginName: string;
	// events: Record<string, (args: TActionMessageArgs, user: User) => void>;
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

export type TRoomIgloo = Partial<IRoom> & {
	id: number;
	name: string;
};

export type TItemSlots = typeof constants.ITEM_SLOTS[number];
