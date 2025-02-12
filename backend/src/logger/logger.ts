import fs from 'fs';
import { pino } from 'pino';

const logFile: string = './logs/app.log';
const isProduction: boolean = process.env.ENVIRONMENT === 'production';

export function initializeLoggingFile() {
    // Check if the log file exists
    if(!fs.existsSync(logFile)) {

        const date = new Date().toLocaleString;

        // If not - write some custom lines
        const initialMessage =
            'Application Log - Service: Spotify Session Backend\n' +
            'Generated on: ' + date + '\n' +
            '===========================================================================================================================================================\n' +
            '\n';

        fs.writeFileSync(logFile, initialMessage);
    } else {
        fs.appendFileSync(logFile, '\n');
    }
}

const logger = pino({
    level: isProduction ? 'info' : 'debug', // default setting
    timestamp: isProduction
    ? () => (`,"time":"${new Date().toISOString()}"`)
    : () => `,"time":"${new Date().toLocaleString()}"`,
    transport: {
        targets: isProduction
        ? [ // production
            {
                target: 'pino/file',
                options: { destination: logFile},
                level: 'info'
            }
        ]
        : [ // development
            {
                target: 'pino-pretty',
                options: {colorize: true},
                level: 'debug'
            },
            {
                target: 'pino/file',
                options: { destination: logFile},
                level: 'info'
            }
        ]
    },
    redact: ['access_token']
});

export default logger;
