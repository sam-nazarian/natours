const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection
  const tours = await Tour.find(); //executes the query, gives us the results in an Array

  // console.log(tours);

  // 2) Build template
  // 3) Render that template using tour data from 1
  res.status(200).render('overview', {
    title: 'All Tours',
    tours: tours
  });
});

//always add next for async functions
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user' //specifying these fields to show
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour: tour
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: `Login`
  });
};
