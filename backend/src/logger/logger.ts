import fs from 'fs';
import { pino } from 'pino';
import { IS_PRODUCTION } from '../config.js';

const logFile = './logs/app.log';

/**
 * Initializes the app.log file. If the file already exists, it created the file and writes some metadata on top of it.
 * Else it just creates a new line break.
 */
// TODO: Replace synchronous file operations with asynchronous ones
export function initializeLoggingFile(): void {
    // Check if the log file exists
    if (!fs.existsSync(logFile)) {
        const date = new Date().toLocaleString;

        // If not - write some custom lines
        const initialMessage =
            'Application Log - Service: Spotify Session Backend\n' +
            'Generated on: ' +
            date +
            '\n' +
            '===========================================================================================================================================================\n' +
            '\n';

        fs.writeFileSync(logFile, initialMessage);
    } else {
        // If - add line break
        fs.appendFileSync(logFile, '\n');
    }
}

/**
 * Pino logger. It writes into the app.log file. It uses the default log levels:
 *
 * 'trace' [10] - logger.trace(object, 'message');
 *
 * 'debug' [20] - logger.debug(object, 'message');
 *
 * 'info' [30] - logger.info(object, 'message');
 *
 * 'warn' [40] - logger.warn(object, 'message');
 *
 * 'error' [50] - logger.error(err, 'message');
 *
 * 'fatal' [60] - logger.fatal(err, 'message');
 *
 * Redacted fields: ['access_token', 'accessToken']
 */
const logger = pino({
    level: IS_PRODUCTION ? 'info' : 'debug', // default setting
    timestamp: IS_PRODUCTION
        ? () => `,"time":"${new Date().toISOString()}"`
        : () => `,"time":"${new Date().toLocaleString()}"`,
    transport: {
        targets: IS_PRODUCTION
            ? [
                  // production
                  {
                      target: 'pino/file',
                      options: { destination: logFile },
                      level: 'info',
                  },
              ]
            : [
                  // development
                  {
                      target: 'pino-pretty',
                      options: { colorize: true },
                      level: 'debug',
                  },
                  {
                      target: 'pino/file',
                      options: { destination: logFile },
                      level: 'info',
                  },
              ],
    },
    redact: ['access_token', 'accessToken'],
});

export default logger;
