// Dependencies
const readline = require('readline');
const events = require('events');
class _events extends events{};
const e = new _events();
const {findUser, listUsers, findCheck, listChecks, findLog, listLogs, details, stats} = require('./lib/cli');

// Container for the cli
const cli = {};

// cli events
e.on('help', (str) =>{
    cli.responders.help();
});

e.on('man', (str) =>{
    cli.responders.help();
});

e.on('exit', (str) =>{
    cli.responders.exit();
});

e.on('listUsers', (str) =>{
    cli.responders.allUsers();
});

e.on('moreUserInfo', (str) =>{
    cli.responders.userDetails(str);
});

e.on('listChecks', (str) =>{
    cli.responders.allChecks(str);
});

e.on('moreCheckInfo', (str) =>{
    cli.responders.checkDetails(str);
});

e.on('listLogs', (str) =>{
    cli.responders.allLogs()
});

e.on('moreLogInfo', (str) =>{
    cli.responders.logDetails(str);
});

e.on('stats', (str) =>{
    cli.responders.stats();
});

// CLI responders
cli.responders = {};

cli.responders.allUsers = () =>{
    listUsers();
};

cli.responders.userDetails = (str) => {
    const strArray = str.split('--');
    const userId = typeof(strArray[1]) === 'string' && strArray[1].trim().length > -1 ? strArray[1].trim() : false;
    if(userId){
        findUser(userId);
    }else{
        console.log('Missing required field: <--userId>');
    }
    
};

cli.responders.allChecks = (str) =>{
    const strArray = str.split('--');
    const state = typeof(strArray[1]) === 'string' && ['up', 'down'].indexOf(strArray[1].trim()) > -1 ? strArray[1].trim() : false;
    if(state){
        listChecks(state);
    }else{
        listChecks()
    }
};

cli.responders.checkDetails = (str) =>{
    const strArray = str.split('--');
    const checkId = typeof(strArray[1]) === 'string' && strArray[1].trim().length > -1 ? strArray[1].trim() : false;
    
    if(checkId){
        findCheck(checkId);
    }else{
        console.log('Missing required field <--checkId>');
    }
    
};

cli.responders.allLogs = () =>{
    listLogs();
};

cli.responders.logDetails = (str) =>{
    const strArray = str.split('--');
    const logId = typeof(strArray[1]) === 'string' && strArray[1].trim().length > -1 ? strArray[1] : false;
    if(logId){
        findLog(logId);
    }else{
        console.log('Missing required field: <--logId>');
    }
};


cli.responders.help = () =>{
    details();
};

cli.responders.stats = () =>{
    stats();
};

cli.inputProcessor = (str) =>{
    str = typeof(str) === 'string' && str.trim().length > 0 ? str.trim() : false;

    if(str){
        const acceptableInputs = [
            'man',
            'stats',
            'help',
            'listUsers',
            'moreUserInfo',
            'listChecks',
            'moreCheckInfo',
            'listLogs',
            'moreLogInfo'
        ];

        let matchFound = false;

        acceptableInputs.some((input) =>{
            if(str.indexOf(input) > -1){
                // Match is found
                matchFound = true;
        
                e.emit(input, str);
                return true;
            }
        })
        if(!matchFound){
            console.log('Sorry, try again...');
        }
    }
};

cli.init = () =>{
    //await connectDB(process.env.MONGO_URI);
    // Notify users that server is up
    console.log('\x1b[34m%s\x1b[0m', 'The CLI is up and running');
    
    const _interface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: ''
    });

    // Create an initial prompt
    _interface.prompt();

    _interface.on('line', (str)=>{
        // Send input to the processor
        cli.inputProcessor(str);

        // Restart the prompt
        _interface.prompt();
    });

    // If the user stops the CLI, kill the operation
    _interface.on('close', () =>{
        process.exit(0);
    });
}

module.exports = cli;