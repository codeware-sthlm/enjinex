import { createLogger, format, transports } from 'winston';

/**
 * Log
 */
export const logger = createLogger({
	level: 'info',
	format: format.combine(
		format.timestamp({
			format: 'YYYY-MM-DD HH:mm:ss'
		}),
		format.errors({ stack: true }),
		format.splat(),
		format.json()
	),
	defaultMeta: { service: 'nginx-certbot' },
	transports: [
		//
		// - Write all logs with level `error` and below to `error.log`
		// - Write all logs with level `info` and below to `combined.log`
		//
		new transports.File({ filename: 'logs/error.log', level: 'error' }),
		new transports.File({ filename: 'logs/combined.log' })
	]
}).add(
	new transports.Console({
		format: format.combine(
			format.colorize(),
			format.printf(
				(info) => `${info.level}: [${info.timestamp}] ${info.message}`
			)
		)
	})
);
