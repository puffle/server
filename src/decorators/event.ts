import 'reflect-metadata';
import { IGamePlugin } from '../types/types';

export interface IEventDecoratorMetadata { eventName: string; }

export function Event(eventName: string)
{
	return function (target: IGamePlugin, propertyKey: string)
	{
		Reflect.defineMetadata('PluginEvent', { eventName }, target, propertyKey);
	};
}
