import { CustomError } from '@n0bodysec/ts-utils';
import { Logger } from '../managers/LogManager';

process.on('uncaughtException', (err: Error, origin: string) =>
{
	if (err instanceof CustomError)
	{
		CustomError.print(err);
		Logger.transports[Logger.transports.length - 1]!.silent = true; // silence console transport
		Logger.fatal(`Uncaught Exception: ${JSON.stringify(err)}\nStack: ${err.stack}\nOrigin: ${origin}`);
		process.exit(err.code);
	}
	else
	{
		Logger.fatal(`Uncaught Exception: ${err.stack}\nOrigin: ${origin}`);
		process.exit(1);
	}
});

process.on('unhandledRejection', (reason: Error /* , promise: Promise<unknown> */) =>
{
	if (reason instanceof CustomError)
	{
		CustomError.print(reason);
		Logger.transports[Logger.transports.length - 1]!.silent = true; // silence console transport
		Logger.fatal(`Unhandled Rejection: ${JSON.stringify(reason)}\nStack: ${reason.stack}`);
		process.exit(reason.code);
	}
	else
	{
		Logger.fatal(`Unhandled Rejection: ${reason.stack}`);
		process.exit(1);
	}
});
