const mongoose = require('mongoose');
const _url = require('url');
const dns = require('dns').promises;

const ChecksSchema = new mongoose.Schema({
    url: {
        type: String,
        minlength: [3, `URL cannot be less than 3 characters`],
        maxlength: [50, `URL cannot be more than 50 characters`],
        required: [true, `Please provide a URL`]
    },
    protocol:{
        type: String,
        enum: ['http', 'https'],
        default: 'http'
    },
    method: {
        type: String,
        enum: ['post', 'get', 'put', 'delete'],
        default: 'get'
    },
    statusCodes: {
        type: [Number],
        validate: {
            validator: function(arr){
                return arr.length > 0;
            },
            message: props => `The ${props.path} array cannot be empty. Please enter at least one status code`
        },
        required: [true, `Please select at least one statuscode`]
    },
    timeoutSeconds:{
        type: Number,
        min: [1, `TimeoutSeconds must be at least 1 second`],
        max: [5, `Timeout seconds cannot be more 5 seconds`],
        validate: {
            validator: function(timer){
                return timer % 1 === 0;
            },
            message: props => `${props.path} must be an integer`
        },
        required: [true, `Please provide timeout seconds`]
    },
    createdBy:{
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    state: {
        type: String,
        enum: ['up', 'down'],
        default: 'down',
        required: [true, `The state of the check is undefined`]
    },
    lastChecked: {
        type: Date, 
        default: new Date(),
        required: [true, `Last check is undefined. Something is wrong`]
    },
    phone: {
        type: String,
        minlength: [10, `Phone number must be 10 characters (exclude the country code eg. +234)`],
        maxlength: [10, `Phone number must be 10 characters (exclude the country code eg. +234)`],
        required: [true, `Please provide your phone number`]
    }
}, {timestamps: true});

ChecksSchema.pre('save', async function(next){
    let parsedUrl = _url.parse(this.protocol+'://'+this.url, true);
    let hostname = parsedUrl.hostname;
    await dns.resolve(hostname);
    next();
});

module.exports = mongoose.model('Checks', ChecksSchema);