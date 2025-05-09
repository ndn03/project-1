const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brand.controller');

router.get('/', brandController.getAllBrands);
// ... các route khác

module.exports = router;
