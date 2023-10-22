export interface IFlooring
{
	name: string;
	cost: number;
	patched: number;
}

export interface IFurniture
{
	name: string;
	type: number;
	sort: number;
	cost: number;
	member: number;
	bait: number;
	patched: number;
	max: number;
	fps?: number;
}

export interface IIgloo
{
	name: string;
	cost: number;
	patched: number;
}

export interface IItem
{
	name: string;
	type: number;
	cost: number;
	member: number;
	bait: number;
	patched: number;
	treasure: number;
}

export interface IRoom
{
	id: number;
	name: string;
	member: number;
	maxUsers: number;
	game: number;
	spawn: number;
}

export interface ITable
{
	id: number;
	roomId: number;
	game: 'four' | 'mancala';
}

export interface IWadle
{
	id: number;
	roomId: number;
	seats: number;
	game: 'sled' | 'card';
}

export interface ICard
{
	name: number | string;
	setId: number;
	powerId: number;
	element: 'f' | 's' | 'w';
	color: 'b' | 'g' | 'o' | 'p' | 'r' | 'y';
	value: number;
}

export interface IMatchMaker
{
	game: 'card';
}

export interface ICrumbs
{
	floorings: Record<number, IFlooring>;
	furnitures: Record<number, IFurniture>;
	igloos: Record<number, IIgloo>;
	items: Record<number, IItem>;
	rooms: IRoom[];
	tables: ITable[];
	waddles: IWadle[];
	cards: Record<number, ICard>;
	decks: Record<number, number[]>;
	matchMakers: Record<number, IMatchMaker>,
}
