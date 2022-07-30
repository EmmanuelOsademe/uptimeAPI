const Checks = require('./models/Check');
const axios = require('axios');
const {CheckModel, LogsModel} = require('./models/CheckLogs');
const {CompressedCheckModel, CompressedLogModel} = require('./models/CompressedLogs');
const zlib = require('zlib');
const util = require('util')
const gzip = util.promisify(zlib.gzip);
const User = require('./models/User');



// Twilio configuration 
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

// Container for the processor
const processor = {};

// Gather all checks 
processor.gatherAllChecks = async () =>{
    const checks = await Checks.find({});
    if(checks && checks.length > 0){
        checks.forEach(originalCheckData => {
            processor.validateChecks(originalCheckData);
        });
    }else{
        console.log('No check data available at the moment');
    }
};

processor.validateChecks = (originalCheckData) =>{
    // Mandatory fields
    originalCheckData = typeof(originalCheckData) === 'object' ? originalCheckData : {};
    originalCheckData._id = typeof(originalCheckData._id) === 'string' && originalCheckData._id.length > 0  ? originalCheckData._id : false;
    originalCheckData.protocol = typeof(originalCheckData.protocol) === 'string' && ['http', 'https'].indexOf(originalCheckData.protocol.toLowerCase()) > -1 ? originalCheckData.protocol.toLowerCase() : false;
    originalCheckData.method = typeof(originalCheckData.method) === 'string' && ['get', 'post', 'put', 'delete'].indexOf(originalCheckData.method.toLowerCase()) > -1 ? originalCheckData.method.toLowerCase() : false;
    originalCheckData.url = typeof(originalCheckData.url) === 'string' && originalCheckData.url.length > 0 ? originalCheckData.url : false;
    originalCheckData.statusCodes = typeof(originalCheckData.statusCodes) === 'object' && originalCheckData.statusCodes instanceof Array && originalCheckData.statusCodes.length > 0 ? originalCheckData.statusCodes : false;
    originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) === 'number' && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 5 && originalCheckData.timeoutSeconds % 1 === 0 ? originalCheckData.timeoutSeconds : false;
    originalCheckData.createdBy = typeof(originalCheckData.createdBy) === 'string' && originalCheckData.createdBy.length > 0 ? originalCheckData.createdBy : false;
    originalCheckData.phone = typeof(originalCheckData.phone) === 'string' && originalCheckData.phone.trim().length === 10 ? originalCheckData.phone.trim() : false;

    // Additional field
    originalCheckData.status = typeof(originalCheckData.status) === 'string' && ['up', 'down'].indexOf(originalCheckData.status.toLowerCase()) > -1 ? originalCheckData.status : 'down';
    originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) === 'string' && originalCheckData.lastChecked.length > 0 ? originalCheckData.lastChecked : false;

    if(originalCheckData._id &&
        originalCheckData.protocol &&
        originalCheckData.method &&
        originalCheckData.url &&
        originalCheckData.statusCodes && 
        originalCheckData.timeoutSeconds &&
        originalCheckData.createdBy && 
        originalCheckData.phone){
        
        // Process the check data
        processor.performCheck(originalCheckData);

    }else{
        console.log(`At least, one check data is not properly formatted. Skipping...`);
    }
};

processor.performCheck = async (originalCheckData) =>{
    const checkOutcome = {
        responseCode: false,
        error: false
    };

    let outcomeSent = false;

    let fullUrl = originalCheckData.protocol+'://'+originalCheckData.url;

    const requestData = {
        method: originalCheckData.method,
        url: fullUrl
    }

    // Make the request
    try {
        const response = await axios.request(requestData);
        
        checkOutcome.responseCode = response.status;
        if(!outcomeSent){
            processor.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    } catch (error) {
        if(error.response){
            checkOutcome.responseCode = error.response.status;
            checkOutcome.error = error.message;
            if(!outcomeSent){
                processor.processCheckOutcome(originalCheckData, checkOutcome);
                outcomeSent = true;
            }
        }else{
            checkOutcome.error = `${error.message} on ${originalCheckData.protocol}://${originalCheckData.url}`;
            if(!outcomeSent){
                processor.processCheckOutcome(originalCheckData, checkOutcome);
                outcomeSent = true;
            }
        }
    }
}

processor.processCheckOutcome = async (originalCheckData, checkOutcome) =>{
    const state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.statusCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';
    const alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : '';

    const timeOfCheck = new Date();

    const newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = timeOfCheck;
    
    const checkId = newCheckData._id;

    await Checks.findOneAndUpdate({_id: checkId}, newCheckData, {new: true, runValidators: true});
    
    if(alertWarranted){
        console.log(newCheckData);
        console.log('Alert is warranted');
        //processor.sendTextMessage(originalCheckData);
        processor.logProcessedChecks(newCheckData, checkOutcome, state, alertWarranted, timeOfCheck);
    }
};

processor.sendTextMessage = async function(originalCheckData){
    const message = `Your ${originalCheckData.method.toUpperCase()} check to ${originalCheckData.protocol}://${originalCheckData.url} is: ${originalCheckData.state.toUpperCase()}`;

    await client.messages.create({
        body: message, 
        from: process.env.TWILIO_FROM_PHONE,
        to: `+234${originalCheckData.phone}`
    });
};

processor.logProcessedChecks = async (newCheckData, checkOutcome, state, alertWarranted, timeofCheck) =>{
    // Collate log data
    const updateData = {
        checkData: newCheckData,
        checkOutcome: checkOutcome,
        state: state,
        alertWarranted: alertWarranted, 
        timeofCheck: timeofCheck
    };

    const checkId = newCheckData._id;

    const logStore = await LogsModel.findOne({logId: checkId});

    if(!logStore){
        await LogsModel.create({logId: checkId, logs: updateData});
    }else{
        const logsArray = logStore.logs;
        logsArray.push(updateData);
        await LogsModel.findOneAndUpdate({logId: checkId}, {logs: logsArray}, {new: true, runValidators: true});
    }
};

/*processor.compressLogs = async () =>{
    const logs = await LogsModel.find({});
    console.log(logs);
    logs.forEach(log =>{
        const logId = log._id;
        console.log(logId);
        const buffer = await gzip(log.logs);

        //const logStore = await CompressedLogModel.findOne({logId: logId});
        if(!logStore){
            //await CompressedLogModel.create({logId: logId, compressedLogs: buffer});
        }else{
            const logsArray = logStore.compressedLogs;
            logsArray.push(buffer);
            //await CompressedLogModel.findOneAndUpdate({logId: logId}, {compressedLogs: logsArray}, {new: true, runValidators: true})
        }
    })
}*/

processor.init = () =>{
    // Initialise the processing
    console.log('\x1b[33m%s\x1b[0m', 'Checks processor is up and running');
    processor.gatherAllChecks();

    // Loop through the Processing
    setInterval(() => {
        processor.gatherAllChecks();
    }, 1000 * 60);
}

module.exports = processor;