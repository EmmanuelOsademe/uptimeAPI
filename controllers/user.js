const {StatusCodes} = require('http-status-codes');
const { UnauthenticatedError, BadRequestError } = require('../errors');
const User = require('../models/User');
const Checks = require('../models/Check');
const {CheckModel, LogsModel} = require('../models/CheckLogs');

const updateUser = async (req, res) =>{
    // Grab fields for modification from the request's body 
    const {firstname, lastname, phone, email, password} = req.body;
    const userId = req.user.userId;
    
    if(!(firstname || lastname || phone || email || password)){
        throw new BadRequestError(`No field(s) for update`);
    }

    // Ensure that the user exists
    let user = await User.findOne({_id: userId});

    if(!user){
        throw new BadRequestError(`No user with ID: ${userId}`)
    }

    req.body.password = await user.hashPassword(password)

    user = await User.findOneAndUpdate(
        {_id: userId},
        req.body,
        {new: true, runValidators: true}
    )

    res.status(StatusCodes.OK).json({user});
};

// deleteUser
const deleteUser = async (req, res) =>{
    const {userId }= req.user;

    // Ascertain that user exist and remove user
    const user = await User.findOneAndRemove({_id: userId});
    
    if(!user){
        throw new BadRequestError(`No user with ID ${userId}`);
    }

    // Find all the user's checks
    const userChecks = await Checks.find({createdBy: userId});

    if(userChecks.length > 0){
        // Loop through and delete
        userChecks.forEach(async (check) =>{
            await Checks.findOneAndRemove({_id: check._id});
            await LogsModel.findOneAndRemove({logId: check._id});
        })
    }

    res.status(StatusCodes.OK).json({"Success": `User and associated data deleted`});
}

module.exports = {updateUser, deleteUser};