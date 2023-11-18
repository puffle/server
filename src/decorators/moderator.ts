import { CustomError } from '@n0bodysec/ts-utils';
import { User } from '../classes/user/User';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Moderator(target: unknown, propertyKey: string, descriptor: TypedPropertyDescriptor<any>)
{
	const originalMethod = descriptor.value;

	descriptor.value = function (...args: unknown[])
	{
		if (!(args[1] instanceof User)) throw new CustomError(`The second arg is not an instance of User in ${propertyKey}`);

		const user = args[1];
		if (!user.isModerator) return undefined;

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		return originalMethod.apply(this, args);
	};

	return descriptor;
}
