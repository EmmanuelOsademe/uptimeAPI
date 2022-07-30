const express = require('express');
const router = express.Router();

// Controller
const {createAccount, login} = require('../controllers/auth');

router.post('/register', createAccount);
router.post('/login', login);

module.exports = router;