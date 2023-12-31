import type { IGamePlugin } from '../types/types';

export interface IEventDecoratorMetadata { eventName: string; }

export function Event(eventName: string)
{
	return function (target: IGamePlugin, propertyKey: string)
	{
		Reflect.defineMetadata('PluginEvent', { eventName }, target, propertyKey);
	};
}

export function GetPluginEventMetadata(plugin: IGamePlugin, method: string)
{
	return Reflect.getMetadata('PluginEvent', plugin, method) as IEventDecoratorMetadata | undefined;
}
