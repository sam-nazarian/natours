const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

// POST /tour/234fad4/reviews
// GET /tour/234fad4/reviews
// Post /reviews

const router = express.Router({ mergeParams: true }); //can see parameter of other routers

//protects all routes that come after this point
router.use(authController.protect);

// api/v1/reviews/ = /
// api/v1/tours/:tourId/reviews = /
router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(authController.restrictTo('user'), reviewController.setTourUserIds, reviewController.createReview);

// api/v1/reviews/:id = /:id
// also works for: api/v1/tours/:tourId/reviews/:id /
router
  .route('/:id')
  .get(reviewController.getReview)
  //problem arises as anybody can update or delete any review even ones posted from different users
  .patch(authController.restrictTo('admin', 'user'), reviewController.updateReview)
  .delete(authController.restrictTo('admin', 'user'), reviewController.deleteReview);

module.exports = router;
