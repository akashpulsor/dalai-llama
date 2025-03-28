import winston, { format, Logger } from 'winston';
import { configurationService } from '../services/configurationService';

const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    silly: 4,
};

const logFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.printf(({ timestamp, level, message, ...info }) => {
        let logMessage = `${timestamp} [${level.toUpperCase()}] ${message}`;
        if (Object.keys(info).length) {
            logMessage += ` ${JSON.stringify(info, null, 2)}`;
        }
        return logMessage;
    })
);

let logger: Logger;

const initializeLogger = () => {
    if (!logger) {
        try {
            const environment = configurationService.get('environment'); // No Default Value
            const isProduction = environment === 'production';

            logger = winston.createLogger({
                level: isProduction ? 'info' : 'debug',
                levels: logLevels,
                format: logFormat,
                transports: [
                    new winston.transports.Console({
                        stderrLevels: ['error', 'warn'],
                    }),
                    ...(isProduction
                        ? [
                            new winston.transports.File({
                                filename: 'logs/error.log',
                                level: 'error',
                            }),
                            new winston.transports.File({
                                filename: 'logs/combined.log',

                            }),
                        ]
                        : []),
                ],
            });
            logger.info(`Logger initialized in ${environment} mode.`);
        } catch (error: any) {
            // Handle the error during logger initialization
            console.error(`Failed to initialize logger: ${error.message}`);
            // You might want to throw the error, or use a default logger
            // throw error;
            const defaultTransports = [new winston.transports.Console()];
            logger = winston.createLogger({
                level: 'debug',
                format: logFormat,
                transports: defaultTransports,
            });
            logger.warn("Using default logger configuration due to error.");
        }

    }
    return logger;
};

const log = {
    error: (message: string, ...meta: any[]) => initializeLogger().error(message, ...meta),
    warn: (message: string, ...meta: any[]) => initializeLogger().warn(message, ...meta),
    info: (message: string, ...meta: any[]) => initializeLogger().info(message, ...meta),
    debug: (message: string, ...meta: any[]) => initializeLogger().debug(message, ...meta),
    silly: (message: string, ...meta: any[]) => initializeLogger().silly(message, ...meta),
};

export { log as logger };
