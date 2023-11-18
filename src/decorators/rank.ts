import { CustomError } from '@n0bodysec/ts-utils';
import { User } from '../classes/user/User';

export function Rank(rank: number)
{
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return function (target: unknown, propertyKey: string, descriptor: TypedPropertyDescriptor<any>)
	{
		const originalMethod = descriptor.value;

		descriptor.value = function (...args: unknown[])
		{
			if (!(args[1] instanceof User)) throw new CustomError(`The second arg is not an instance of User in ${propertyKey}`);

			const user = args[1];
			if (user.data.rank < rank) return undefined;

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
			return originalMethod.apply(this, args);
		};

		return descriptor;
	};
}
