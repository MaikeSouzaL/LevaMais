const express = require('express');
const router = express.Router();
const purposeController = require('../controllers/purpose.controller');

// Routes for /api/purposes
router.get('/', purposeController.getAll);
router.post('/', purposeController.create);
router.put('/:id', purposeController.update);
router.delete('/:id', purposeController.delete);
router.patch('/:id/toggle', purposeController.toggleActive);

module.exports = router;
