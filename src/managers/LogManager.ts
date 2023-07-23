import { greenBright } from 'colorette';
import { addColors, createLogger, format, LeveledLogMethod, transports, Logger as WinstonLogger } from 'winston';

interface ILogManager extends WinstonLogger
{
	fatal: LeveledLogMethod;
	trace: LeveledLogMethod;
	initialize: (level: string) => void;
}

const id = process.argv[2] ?? 'HTTP';

const defaultFormat = format.combine(
	format.timestamp({ format: 'HH:mm:ss' }),
	format.printf((message) =>
	{
		const prefix = `[${message.timestamp} | ${id}]`;
		const identifier = message.level === 'info' ? greenBright(prefix) : prefix;
		return `${identifier} ${message.message}`;
	}),
);

const formatFile = format.combine(
	format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
	format.printf((message) => `${message.timestamp} [${message.level}] ${message.message}`),
);

const options = {
	level: 'info',
	format: defaultFormat,

	levels: {
		fatal: 0,
		error: 0,
		warn: 1,
		success: 2,
		info: 3,
		trace: 4,
		debug: 4,
	},

	transports: [
		new transports.File({
			level: 'error',
			filename: `${id}.error.log`,
			dirname: 'logs',
			format: formatFile,
		}),

		new transports.File({
			filename: `${id}.combined.log`,
			dirname: 'logs',
			format: formatFile,
		}),

		// console transport MUST be the last one (see utils/setup.ts)
		new transports.Console({
			format: format.combine(format.colorize({ all: true })),
		}),
	],
};

addColors({
	fatal: 'magenta',
	error: 'red',
	warn: 'yellow',
	success: 'green',
	info: 'white',
	trace: 'gray',
	debug: 'gray',
});

export const Logger = createLogger(options) as ILogManager;

Logger.initialize = (level: string) => { Logger.level = level; };
