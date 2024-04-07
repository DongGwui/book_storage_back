const express = require('express');
const router = express.Router();

const {insertBook, getMyBooks, getBestBooks, getLatestBooks} = require('../controller/book');

router.post('/insert', insertBook);
router.post('/list/my', getMyBooks);
router.post('/list/best', getBestBooks);
router.post('/list/latest', getLatestBooks);



module.exports = router;