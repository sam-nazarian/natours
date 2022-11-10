const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// router.use(authController.isLoggedIn); //runs for all routes

//no base route, base is only being extended
router.get('/', authController.isLoggedIn, viewsController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour); //authController.protect,
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);

//in protect it will give an error if the user is logged in
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours); //bookingController.createBookingCheckout,

router.post('/submit-user-data', authController.protect, viewsController.updateUserData);

module.exports = router;
