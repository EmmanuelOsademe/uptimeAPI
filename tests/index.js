const assert = require('assert');

// Application logic for the test runner
_app = {};

// Container for the tests
_app.tests = {
    'unit': {}
};

// Run all the tests, collecting the errors and successes
_app.runTests = () =>{
    let errors = [];
    let successes = 0;
    let limit = _app.countTests();
    let counter = 0
    for(let key in _app.tests){
        if(_app.tests.hasOwnProperty(key)){
            let subTests = _app.tests[key];
            for(let testName in subTests){
                if(subTests.hasOwnProperty(testName)){
                    (function(){
                        let tempTestName = testName;
                        let testValue = subTests[testName];
                        // Call the test
                        try {
                            testValue(() =>{
                                
                            })
                        } catch (error) {
                            // If it ch
                        }
                    })();
                }
            }
        }
    }
};