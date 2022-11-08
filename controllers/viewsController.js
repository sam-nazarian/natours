const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
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

//use next to send error to errorHandling middleware
//always add next for async functions
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user' //specifying these fields to show

    // user gets access to id, name, & photo of user as reviews populates user
    // since there's a populate on the reviewModel below is not necessarly
    /*
    populate : {
      path: 'user',
      select: 'name photo'
    }
    */
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

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: `Your account`
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  //could use populate method but instead looked for ids in tours manually

  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Find tours with the returned IDs
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});

// use this if you don't have an api
// if an error occurs it goes to errorHandling middleware
exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  );

  // doesn't redirect to new url, just renders account page
  res.status(200).render('account', {
    title: `Your account`,
    user: updatedUser //update the user which was given by the protect middleware
  });
});
