const {CustomAPIError} = require('../errors');
const {StatusCodes} = require('http-status-codes');

const errorHandlerMiddleware = (err, req, res, next) =>{
    console.log(err);
    
    let customError = {
        // Default statusCode and messages
        statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
        msg: err.message || `Something went wrong, please try again later`
    }

    // Check that the error is an instance of  the customAPIError
    /*if(err instanceof CustomAPIError){
        return res.status(err.statusCode).json({msg: err.message});
    }*/

    // Check for an instance of duplicity in the database
    if(err.code && err.code === 11000){
        customError.statusCode = 400;
        customError.msg = `${Object.keys(err.keyValue)} already exists. Please enter another value`
    }

    if(err.name === 'ValidationError'){
        customError.statusCode = 400;
        customError.msg = Object.values(err.errors).map(item => item.message).join('. ');
    }

    if(err.name === 'ValidatorError'){
        customError.statusCode = 400;
        customError.msg = Object.values(err.errors).map(item => item.message).join('. ');
    }

    if(err.name == 'CastError'){
        customError.statusCode = 400;
        customError.msg = `No item with ID: ${err.value}`;
    }

    if(err.code == 'ESERVFAIL'){
        customError.statusCode = 400;
        customError.msg = `The url: ${err.hostname} does not resolve`;
    }

    if(err.code == 'ENOTFOUND'){
        customError.statusCode = 400;
        customError.msg = `The url: ${err.hostname} does not resolve`;
    }
    
    if(err.code == 'ECONNREFUSED'){
        customError.status = 405;
        customError.msg = 'Request refused';
    }
    return res.status(customError.statusCode).json({msg: customError.msg});
    //return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err })
};

module.exports = errorHandlerMiddleware;