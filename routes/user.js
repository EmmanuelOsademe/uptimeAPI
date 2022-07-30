const express = require('express');
const router = express.Router();

// Controller
const {updateUser, deleteUser} = require('../controllers/user');

router.route('/').patch(updateUser).delete(deleteUser);

module.exports = router;