import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Config } from './ConfigManager';

export class RatelimitManager
{
	limiters;

	constructor()
	{
		if (!Config.data.rateLimits.enabled) this.limiters = {};
		else
		{
			this.limiters = {
				connections: new RateLimiterMemory({
					points: Config.data.rateLimits.connections.points,
					duration: Config.data.rateLimits.connections.duration,
				}),

				messages: new RateLimiterMemory({
					points: Config.data.rateLimits.messages.points,
					duration: Config.data.rateLimits.messages.duration,
				}),
			};
		}
	}
}

export const Ratelimiter = new RatelimitManager();
