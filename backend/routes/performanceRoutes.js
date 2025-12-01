// routes/performanceRoutes.js
const express = require('express');
const router = express.Router();
const { evaluatePerformance, listEvaluations, getEvaluation, addRating, listRatings } = require('../controllers/performanceController');
const { protect, checkPermission } = require('../middleware/auth');

router.use(protect);

router.post('/evaluate', checkPermission('performance', 'create'), evaluatePerformance);
router.post('/rate', checkPermission('performance', 'create'), addRating);
router.get('/ratings', listRatings);
router.get('/', checkPermission('performance', 'view'), listEvaluations);
router.get('/:id', checkPermission('performance', 'view'), getEvaluation);

module.exports = router;