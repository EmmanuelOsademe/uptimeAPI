const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    firstname: {
        type: String,
        minlength: [3, `Firstname cannot be less than 3 characters`],
        maxlength: [50, 'Firstname cannot be more than 50 characters'],
        required: [true, `Please provide  your first name`]
    },
    lastname: {
        type: String,
        minlength: [3, `Lastname cannot be less than 3 characters`],
        maxlength: [50, 'Lastname cannot be more than 50 characters'],
        required: [true, `Please provide your last name`]
    },
    phone: {
        type: String,
        minlength: [10, `Phone number must be 10 characters (exclude the country code eg. +234)`],
        maxlength: [10, `Phone number must be 10 characters (exclude the country code eg. +234)`],
        required: true
    }, 
    email: {
        type: String,
        minlength: 5,
        maxlength: 100,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please provide a valid email',
        ],
        required: [true, `Please provide your email address`],
        unique: [true, `Email already exists`]
    },
    password: {
        type: String,
        minlength: 5,
        maxlength: 100,
        required: [true, `Please provide your password`],
    },
    tosAgreement: {
        type: Boolean,
        enum: [true, false],
        default: false
    }
});

// Encrypt the user's password before saving
UserSchema.pre('save', async  function(next){
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

UserSchema.methods.hashPassword = async function(inputPassword){
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(inputPassword, salt);
    return password;
}

// Create JWT
UserSchema.methods.createJWT =  function(){
    // use allkeysgenerator.com to generate jwtsecret
    const token = jwt.sign({userId: this._id, firstname: this.firstname, phone: this.phone}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_LIFETIME});
    return token;
};

// Compare password before login
UserSchema.methods.comparePassword = function(inputPassword){
    const isMatch = bcrypt.compare(inputPassword, this.password);
    return isMatch;
}

// Export the module
module.exports = mongoose.model('User', UserSchema)