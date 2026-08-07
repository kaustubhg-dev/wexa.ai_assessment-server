const router = require('express').Router();

const userController = require('../controllers/userController');
const cartController = require('../controllers/cartController');
const recommendationController = require('../controllers/recommendationController');
const agentController = require('../controllers/agentController');
const categoryController = require('../controllers/categoryController')


router.get('/users', userController.getUsers);
router.get('/users/:id/events', userController.getEvents);
router.get('/users/:id/viewed-not-purchased', userController.getViewedNotPurchased);
router.get('/users/:id/category-affinity', userController.getCategoryAffinity);
router.get('/users/:id/funnel', userController.getFunnel);

router.get('/carts/abandoned', cartController.getAbandoned);

router.get('/categories', categoryController.getCategories);

router.get('/users/:id/recommendations', recommendationController.getRecommendations);
router.get('/recommendations/:productId/explain', recommendationController.explain);

router.post('/ask', agentController.ask);

module.exports = router;