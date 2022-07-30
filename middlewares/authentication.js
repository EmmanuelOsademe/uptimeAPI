const {UnauthenticatedError} = require('../errors');
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) =>{
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith('Bearer ')){
        throw new UnauthenticatedError('Authentication failed');
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {userId: payload.userId, firstname: payload.firstname, phone: payload.phone};
        next();
    } catch (error) {
        throw new UnauthenticatedError('Authentication failed');
    }
};

module.exports = auth;
