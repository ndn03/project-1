const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');

router.get('/', categoryController.getAllCategories);
// ... các route khác

module.exports = router;
