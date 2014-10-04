/**
 * Created by Lars on 29.09.2014.
 */
var winston = require('winston'),
    logger = new (winston.Logger)({
        levels: {
            verbose: 0,
            debug: 1,
            info: 2,
            warn: 3,
            error: 4
        },
        transports: [
            new (winston.transports.Console)
                ({
                    level: 'verbose',
                    colorize: true
                }),
            new (winston.transports.DailyRotateFile)(
                {
                    datePattern: '/yyyy-MM-dd_HH-mm-server.txt',
                    timestamp: true,
                    filename: './log/',
                    level: 'verbose',
                    json: false
                }
            )
        ]
    });
/**
 * Provide a logger for the application
 *
 */
module.exports = logger;
