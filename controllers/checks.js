const Checks = require('../models/Check');
const {StatusCodes} = require('http-status-codes');
const { BadRequestError } = require('../errors');
const {NotFoundError} = require('../errors');

const createCheck = async (req, res) =>{
    req.body.createdBy = req.user.userId;
    req.body.phone = req.user.phone
    const userChecks = await Checks.find({createdBy: req.user.userId});
    if(userChecks.length >= process.env.MAXIMUM_CHECKS){
        throw new BadRequestError(`User already has ${process.env.MAXIMUM_CHECKS}. Checks cannot exceed ${process.env.MAXIMUM_CHECKS}`);
    }
    const check = await Checks.create({...req.body});
    res.status(StatusCodes.CREATED).json({check});
};

const getAllChecks = async (req, res) =>{
    const checks = await Checks.find({createdBy: req.user.userId}).sort('createdAt');
    res.status(StatusCodes.OK).json({checks, counts: checks.length});
};

const getSingleCheck = async (req, res) =>{
    const {user: {userId}, params: {id: checkId}} = req;
    const check = await Checks.findOne({
        _id: checkId,
        createdBy: userId
    });
    if(!check){
        throw new NotFoundError(`No check with ID: ${checkId}`);
    }
    res.status(StatusCodes.OK).json({check});
};

const updateCheck = async (req, res) =>{
    const {
        user: {userId},
        params: {id: checkId},
        body: {url, protocol, method, statusCodes, timeoutSeconds}
    } = req;

    if(!(url || protocol || method || statusCodes || timeoutSeconds)){
        throw new BadRequestError(`No field for update`);
    }

    const check = await Checks.findOneAndUpdate(
        {_id: checkId, createdBy: userId},
        req.body, 
        {new: true, runValidators: true}
    );

    if(!check){
        throw new NotFoundError(`No check with ID: ${checkId}`);
    }

    res.status(StatusCodes.OK).json({check});
};

const deleteCheck = async (req, res) =>{
    const {user:{userId}, params: {id: checkId}} = req;
    const check = await Checks.findOneAndRemove({_id: checkId, createdBy: userId});
    if(!check){
        throw new NotFoundError(`No check with ID: ${checkId}`);
    }
    res.status(StatusCodes.OK).send();
};


module.exports = {createCheck, getAllChecks, getSingleCheck, updateCheck, deleteCheck};