import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDirectory = path.resolve(__dirname, '../../logs');

if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}

// first create a format of how u want to store
const logFormat = winston.format.combine(
    // creates time format 
    winston.format.timestamp({format:'YYYY-MM-DD HH:mm:ss'}),
    // it shows the full error trace
    winston.format.errors({stack:true}),
    // allows other method to use this by doing .info
    // logger.info("User %s logged in", username);
    // So splat() = enables formatted messages. like %s %d
    winston.format.splat(),
    // custom print format
    winston.format.printf( ({timestamp,level,message,stack})=>{
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`
        if(stack){
            log = log+`\n ${stack}`
        }
        return log
    })
)
// where ur logs r going to be sent
const transports =
[
    // this shows logs in terminal
    new winston.transports.Console(
        {
            format:winston.format.combine(
                winston.format.colorize(),
                logFormat
            )
        }
    ),

    // it daily creates a new file and store logs in this file
    // inside logs folder this file will go
    new DailyRotateFile({
        filename:path.join(logDirectory,'application-%DATE%.log'),
        datePattern:'YYYY-MM-DD',
        maxSize:'20m',
        maxFiles:'14d',
        format:logFormat,
    }),

    // only error logs goes to this file
    new DailyRotateFile({
        level:'error',
        filename:path.join(logDirectory,'error-%DATE%'),
        maxSize:'20m',
        maxFiles:'14d',
        format:logFormat,
    })

]

const logger = winston.createLogger({
    level:process.env.LOG_LEVEL || 'info',
    format:logFormat,
    transports,

    // if app crashes due to uncaught error save here
    exceptionHandlers:[
        new winston.transports.File({
            filename:path.join(logDirectory,'exception.log')
        })
    ],

    // these handles promises
    rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDirectory, 'rejections.log') 
    }),
  ],
})

export default logger;
export { logger };

// levels come from
// logger.info()
// logger.error()
// logger.warn()
// logger.debug()
// winston shows all logs in terminal , application logs and error logs
