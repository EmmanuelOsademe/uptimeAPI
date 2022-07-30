const {StatusCodes} = require('http-status-codes');
const { UnauthenticatedError, BadRequestError } = require('../errors');
const User = require('../models/User');

const createAccount =  async (req, res) =>{
    const user = await User.create({...req.body});
    const token = user.createJWT();
    res.status(StatusCodes.CREATED).json({user: {firstname: user.firstname}, token});
};

const login = async (req, res) =>{
    // Grab the email and password from the request's body 
    const {email, password} = req.body;
    if(!email || !password){
        throw new BadRequestError('Please provide email address and password');
    };
    const user = await User.findOne({email});
    if(!user){
        throw new UnauthenticatedError(`User with email: ${email} does not exist`);
    }
    const isPasswordCorrect = await user.comparePassword(password);
    if(!isPasswordCorrect){
        throw new UnauthenticatedError(`Invalid password. Please try again`);
    }
    const token = user.createJWT();
    res.status(StatusCodes.OK).json({user: {firstname: user.firstname}, token});
};

module.exports = {createAccount, login};