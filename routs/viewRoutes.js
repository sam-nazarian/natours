const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.isLoggedIn); //runs for all routes

//no base route, base is only being extended
router.get('/', viewsController.getOverview);
router.get('/tour/:slug', viewsController.getTour); //authController.protect,
router.get('/login', viewsController.getLoginForm);

module.exports = router;
