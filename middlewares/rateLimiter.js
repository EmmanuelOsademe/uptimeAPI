const rateLimit = require('express-rate-limit');
const moment = require('moment');
const redis = require('redis');

const limitUserRequests = rateLimit({
    windowMs: 1000 * 60 * 60 * process.env.WINDOW_SIZE_IN_HOURS,
    max: process.env.MAX_WINDOW_REQUEST_COUNT,
    message: `You have exceeded the ${process.env.MAX_WINDOW_REQUEST_COUNT} requests in ${process.env.WINDOW_SIZE_IN_HOURS} hours limit`,
    standardHeaders: true,
    legacyHeaders: false
});

const redisClient = redis.createClient();

redisClient.on('error', (err) => console.log(`Redis Client Error: ${err}`));

const customRateLimiter = async (req, res, next) =>{
    // Establish connection with redisClient
    await redisClient.connect();

    try {
        // Check that redis client exists
        if(!redisClient){
            console.log('Redis client does not exist!')
            process.exit(1);
            //throw new Error('Redis client does not exist');
            //process.exit(1);
        }
        // fetch records of current user using IP address. Returns null when no record if no record is found
        const record = await redisClient.get(req.ip);
        const currentRequestTime = moment();
        console.log(record);
        // If no record is found, create a new record for user and store to redis
        if(record == null){
            let newRecord = [];
            let requestLog = {
                requestTimeStamp: currentRequestTime.unix(),
                requestCount: 1
            };
            newRecord.push(requestLog);

            await redisClient.set(req.ip, JSON.stringify(newRecord));
        }

        // If record is found, parse it's value and calculate number of requests
        let data = JSON.parse(record);
        let windowStartTimeStamp = moment().subtract(process.env.WINDOW_SIZE_IN_HOURS, 'hours').unix();
        let requestsWithinWindow = data.filter((entry) =>{
            return entry.requestTimeStamp > windowStartTimeStamp;
        });
        console.log('requestsWithinWindow', requestsWithinWindow);
        let totalWindowRequestsCount = requestsWithinWindow.reduce((accumulator, entry) =>{
            return accumulator + entry.requestCount;
        }, 0);

        // If number of requests made is greater than or equal to the desired maximum, return error
        if(totalWindowRequestsCount >= process.env.MAX_WINDOW_REQUEST_COUNT){
            res.status(429).jsend.error(`You have exceeded the ${process.env.MAX_WINDOW_REQUEST_COUNT} requests in ${process.env.WINDOW_SIZE_IN_HOURS} hrs limit!`);
        }else{
            // If number of requests made is less than allowed maximum, log new entry
            let lastRequestLog = data[data.length - 1];
            console.log(lastRequestLog);
            let potentialCurrentWindowIntervalStartTimeStamp = currentRequestTime.subtract(process.env.WINDOW_LOG_INTERVAL_IN_HOURS, 'hours').unix();

            // If interval has not passed since last request log, increment counter
            if(lastRequestLog.requestTimeStamp > potentialCurrentWindowIntervalStartTimeStamp){
                lastRequestLog.requestCount++;
                data[data.length -1] = lastRequestLog;
            }else{
                // If interval has passed, log new entry for current user and timestamp
                data.push({
                    requestTimeStamp: currentRequestTime.unix(),
                    requestCount: 1
                })
            }

            await redisClient.set(req.ip, JSON.stringify(data));
            next();
        }
    } catch (error) {
        console.log(error);
        next(error);
    }
};

module.exports = {limitUserRequests, customRateLimiter};