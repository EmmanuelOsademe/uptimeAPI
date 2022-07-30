const User = require('../models/User');
const Check = require('../models/Check');
const {LogsModel} = require('../models/CheckLogs');
const os = require('os');
const v8 = require('v8');

const findUser = async (userId) =>{
    userId = typeof(userId) === 'string' && userId.trim().length === 24 ? userId.trim() : false;

    if(userId){
        try {
            const user = User.findOne({_id: userId});
            console.log(user);
            if(typeof(user) === 'object' && user.firstname){
                console.log(user);
            }else{
                console.log(`No user with Id: '${userId}'. Try again`);
            }
        } catch (error) {
            console.log('An error occurred. Try again');
        }
    }else{
        console.log(`${userId} is not a valid userId. ID must be 24 characters`);
    }
};

const listUsers = async () =>{
    try {
        const users = await User.find({});
        if(users && users.length > 0){
            users.forEach((user) =>{
                console.log(user._id);
            })
        }else{
            console.log('There are no users currently in the system');
        }
    } catch (error) {
        console.log('An error occurred. Try again...');
    }
};

const findCheck = async (checkId) =>{
    checkId = typeof(checkId) === 'string' && checkId.trim().length === 24 ? checkId.trim() : false;

    if(checkId){
        try {
            const check = await Check.findOne({_id: checkId});
            if(typeof(check) === 'object' && check.protocol){
                console.log(check);
            }else{
                console.log(`No check with ${checkId}. Please try again`);
            }
        } catch (error) {
            console.log(`An error occured. Try again`);
        }
    }else{
        console.log(`Invalid CheckId provided. ID must be 24 characters`);
    }
};

const listChecks = async (state) =>{
    state = typeof(state) === 'string' && ['up', 'down'].indexOf(state) > -1 ? state : false;
    let checks;
    try {
        if(state){
            checks = await Check.find({state: state});
            console.log(`Checks that are ${state.toUpperCase()}: `);
        }else{
            checks = await Check.find({});
            console.log(`All available Checks: `);
        }

        if(checks.length > 0){
            checks.forEach((check) =>{
                console.log(check._id);
            });
        }else{
            console.log('No checks available at the moment');
        }
    } catch (error) {
        console.log('An error occurred. Try again');
    }
}

const findLog = async (logId) =>{
    logId = typeof(logId) === 'string' && logId.trim().length === 24 ? logId.trim() : false;
    if(logId){
        try {
            const log = await LogsModel({_id: logId});
            if(typeof(log) === 'object' && log.logs){
                console.log(log);
            }else{
                console.log(`No log with ${logId}. Try again`);
            }
        } catch (error) {
            console.log(`An error occurred. Try again...`);
        }
    }else{
        console.log(`${logId} is not a valid logId. ID must be 24 characters`);
    }
};

const listLogs = async () =>{
    try {
        const logs = await LogsModel.find({});
        if(logs && logs.length > 0){
            logs.forEach((log) =>{
                console.log(log._id);
            });
        }else{
            console.log('There are no logs at the moment');
        }
    } catch (error) {
        console.log(`An error occurred. Please try again`);
    }
    const logs = await LogsModel.find({});
    logs.forEach(log =>{
        console.log(log._id);
    })
};

const details = () =>{
    const commands = {
        'man': 'Show this help page',
        'help': 'Alias of the "man" command',
        'stats': 'Get statistics on the underlying operating system and resource utilisation',
        'list users': 'Show a list of all the registered users in the system',
        'more user info --(userId)': 'Show details of a specific user',
        'list checks --up --down': 'Show a list of all the active checks in the system, including their state. The --up and --down flags are both optional',
        'more check info --(checkId)': 'Show details of the specified check',
        'list logs': 'Show a list of all the log files available to be read (compressed only)',
        'more log info --(filename)': 'Show details of a specified log file'
    };

    // Show Header
    drawHorizontalLine();
    writeCenteredText('CLI MANUAL')
    drawHorizontalLine();
    addVerticalSpace();

    for(let key in commands){
        if(commands.hasOwnProperty(key)){
            let value = commands[key];
            let line = '\x1b[33m'+key+'\x1b[0m';
            let padding = 60 - line.length;
            for(let i = 0; i < padding; i++){
                line += ' ';
            }
            line += value;
            console.log(line);
        }
    }

    addVerticalSpace();
    drawHorizontalLine()
    writeCenteredText('End of CLI MANUAL');
    drawHorizontalLine();
}

const drawHorizontalLine = () =>{
    let width = process.stdout.columns;
    let line = '';
    for(let i=0; i< width; i++){
        line += '-';
    }
    console.log(line);
}

const addVerticalSpace = (num) =>{
    num = typeof(num) === 'number' && num > 0 ? num : 1;
    for(let i = 0; i < num; i++){
        console.log('');
    }
};

const writeCenteredText = (inputText) =>{
    inputText = typeof(inputText) === 'string' && inputText.trim().length > 0 ? inputText.trim() : '';
    let width = process.stdout.columns;
    let startingPoint = Math.floor((width - inputText.length)/2);
    let line = '';
    for(let i = 0; i < startingPoint; i++){
        line += ' ';
    }
    line += inputText;
    console.log(line);
};

const stats = () =>{
    // Compile statistics Object
    const statsDetails = {
        'Load Average': os.loadavg().join(' '),
        'CPU Count': os.cpus().length,
        'Free Memory': `${(os.freemem()/1000000000).toFixed(2)} GB`,
        'Uptime': `${os.uptime()} seconds`,
        'Current Allocated Memory': `${(v8.getHeapStatistics().malloced_memory/1000000).toFixed(2)} MB`,
        'Peak Memory Allocated': `${(v8.getHeapStatistics().peak_malloced_memory/1000000).toFixed(2)} MB`,
        'Allocated Heap Used': `${Math.floor((v8.getHeapStatistics().used_heap_size/v8.getHeapStatistics().total_heap_size) * 100)} %`,
        'Available Heap Allocated': `${Math.floor((v8.getHeapStatistics().total_heap_size/v8.getHeapStatistics().heap_size_limit) * 100)} %`
    };

    drawHorizontalLine();
    writeCenteredText('SYSTEM STATISTICS');
    drawHorizontalLine();
    addVerticalSpace()

    for(key in statsDetails){
        if(statsDetails.hasOwnProperty(key)){
            //const width = process.stdout.columns;
            const value = statsDetails[key];
            let line = key;
            const padding = 40 - line.length;
            for(let i = 0; i < padding; i++){
                line += ' '
            }

            line += value;
            console.log(line);
        }
    };

    addVerticalSpace();
    drawHorizontalLine();
    writeCenteredText('END OF SYSTEM STATISTICS');
    drawHorizontalLine();
};

module.exports = {findUser, listUsers, findCheck, listChecks, findLog, listLogs, details, stats};