const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
// const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./../routs/reviewRoutes');

//MOUNTING & ROUTES
//convention to call this a router
const router = express.Router(); //creting a new router, which is middleware, save that to variable

//user must be logged in. only 'user' can post reviews.
// router.route('/:tourId/reviews').post(authController.protect, authController.restrictTo('user'), reviewController.createReview);
router.use('/:tourId/reviews', reviewRouter); //for this route usse review router, same as app

//AGGREGATION ROUTES
router.route('/top-5-cheap').get(tourController.alias, tourController.getAllTours); //middleware here
router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(authController.protect, authController.restrictTo('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan);
 
//TOUR ROUTES
router
  .route('/')
  .get(tourController.getAllTours)
  .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.updateTour)
  .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour);

// /tours-within/233/center/-40,35/unit/mi
// /tours-within?distance=233&center=-40,45&unit=mi //another way
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

module.exports = router;

/* value hods value of id parameter
router.param('id', tourController.checkId); //special param middleware, callback only runs when a parameter with the name 'id' exists */
