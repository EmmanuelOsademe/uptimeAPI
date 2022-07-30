const express = require('express');
const router = express.Router();

// Controller
const {createCheck, getAllChecks, getSingleCheck, updateCheck, deleteCheck} = require('../controllers/checks');

router.route('/').post(createCheck).get(getAllChecks);
router.route('/:id').get(getSingleCheck).patch(updateCheck).delete(deleteCheck);

module.exports = router;