const Review = require('./../models/reviewModel'); //Review is a collection
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

// catchAsync(async (req, res, next) => {
//   const reviews = await Review.find(filter);

//   res.status(200).json({
//     status: 'success',
//     results: reviews.length,
//     data: {
//       reviews
//     }
//   });
// });

exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId; //if no tour id given, set to parameter id (form router)
  if (!req.body.user) req.body.user = req.user.id; //if no user id given, set to logged in user id (got from protect)
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
