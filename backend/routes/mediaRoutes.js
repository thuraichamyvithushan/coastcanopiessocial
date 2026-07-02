const express = require('express');
const { getMediaById } = require('../controllers/mediaController');

const router = express.Router();

router.get('/:id', getMediaById);

module.exports = router;
