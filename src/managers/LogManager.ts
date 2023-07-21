import { greenBright } from 'colorette';
import { addColors, createLogger, format, transports } from 'winston';
import { Config } from './ConfigManager';

const id = process.argv[2] ?? 'HTTP';

const levels = Object.freeze({
	error: 0,
	warn: 1,
	success: 2,
	info: 3,
	debug: 4,
});

const colors = Object.freeze({
	error: 'red',
	warn: 'yellow',
	success: 'green',
	info: 'white',
	debug: 'gray',
});

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
	levels,
	level: Config.data.logLevel,
	format: defaultFormat,

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

		new transports.Console({
			format: format.combine(format.colorize({ all: true })),
		}),
	],
};

addColors(colors);

export const Logger = createLogger(options);
