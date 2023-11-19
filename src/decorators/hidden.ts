import { CustomError } from '@n0bodysec/ts-utils';
import { User } from '../classes/user/User';

/**
 * Prevent hidden users (user.isHidden === true) from executing an event.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function PreventHiddenUser(target: unknown, propertyKey: string, descriptor: TypedPropertyDescriptor<any>)
{
	const originalMethod = descriptor.value;

	descriptor.value = function (...args: unknown[])
	{
		if (!(args[1] instanceof User)) throw new CustomError(`The second arg is not an instance of User in ${propertyKey}`);

		if (args[1].isHidden) return undefined;

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		return originalMethod.apply(this, args);
	};

	return descriptor;
}
