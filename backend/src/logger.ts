import { pino } from 'pino';

const isProduction = process.env.ENVIRONMENT === 'production';

const logger = pino({
    level: isProduction ? 'info' : 'debug', // default setting
    transport: {
        targets: isProduction
        ? [ // production
            {
                target: 'pino/file',
                options: { destination: './logs/app.log'},
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
                options: { destination: './logs/app.log'},
                level: 'info'
            }
        ]
    }
});

export default logger;
