import { Assert, Check, ExactProps } from 'ts-runtime-checks';
import { constants } from '../utils/constants';
import { IRoom } from './crumbs';

// ts-runtime-checks
export type Validate<T, ReturnValue = undefined> = Assert<T, ReturnValue>;
export type ValidateExact<T extends object, ReturnValue = undefined> = Assert<ExactProps<T, true, true>, ReturnValue>;
export type MinInclusive<T extends string | number> = number & Check<`$self >= ${T}`, `to be greater or equal than ${T}`, 'minInclusive', T>;
export type MaxInclusive<T extends string | number> = number & Check<`$self <= ${T}`, `to be less or equal than ${T}`, 'maxInclusive', T>;
export type MinLenInclusive<T extends string | number> = Check<`$self.length >= ${T}`, `to have a length greater or equal than ${T}`, 'minLenInclusive', T>;
export type MaxLenInclusive<T extends string | number> = Check<`$self.length <= ${T}`, `to have a length less or equal than ${T}`, 'maxLenInclusive', T>;
export type NumberRange<T extends number[]> = number & Check<`$self >= ${T[0]} && $self <= ${T[1]}`, `to be in range of [${T[0]}, ${T[1]}]`, 'numberRange', T[number]>;
export type NumberRangeExclusive<T extends number[]> = number & Check<`$self > ${T[0]} && $self < ${T[1]}`, `to be in range of (${T[0]}, ${T[1]})`, 'numberRangeExclusive', T[number]>;
export type LenRange<T extends number[]> = string & Check<`$self.length >= ${T[0]} && $self.length <= ${T[1]}`, `to have a length in range of [${T[0]}, ${T[1]}]`, 'lenRange', T[number]>;
export type LenRangeExclusive<T extends number[]> = string & Check<`$self.length > ${T[0]} && $self.length < ${T[1]}`, `to have a length in range of (${T[0]}, ${T[1]})`, 'lenRangeExclusive', T[number]>;

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
