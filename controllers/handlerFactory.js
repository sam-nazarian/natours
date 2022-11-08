const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');

//calling the catchAsync function, with the parameter
//the result of calling 'catchAsync' will be the returned function in catchAsync

//returns func
exports.deleteOne = (Model) => {
  //calling catchAsync func, will get a return value of (reqd, resd, nextd) function, this will then be the final return value, so req,res,next will be passed to that function.
  return catchAsync(async (req, res, next) => {
    // try {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No doc found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  });
};

// dont use this to change password
exports.updateOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true, //return updated document, than original
        runValidators: true
      }
      // ,
      // (err) => {
      //   if (err) {
      //     return next(new AppError('No tour found with that ID', 404));
      //   }
      // }
    );

    if (!doc) {
      return next(new AppError('No doc found with that ID', 404));
    }

    //Model.findByIdAndUpdate(id, { $set: { name: 'jason bourne' }}, options, callback)

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });
};

exports.createOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    // const document = new Tour({});
    // document.save()

    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });
};

exports.getOne = (Model, popOptions) => {
  return catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    //find document with the id in tour collection
    // const doc = await Model.findById(req.params.id).populate('reviews');

    if (!doc) {
      return next(new AppError('No doc found with that ID', 404));
    }

    // Tour.findOne({_id: req.params.id})  Same As The Above

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });
};

exports.getAll = (Model) => {
  return catchAsync(async (req, res, next) => {
    //for getAllReviews in review route (small hack)
    //allows nested GET reviews on tour
    let filter = {}; //empty filter searches for everything
    //check if url has tourId 'api/v1/tours/:tourId/reviews'
    if (req.params.tourId) filter = { tour: req.params.tourId }; //tour value in schema match tourId

    // EXECUTE QUERY
    // console.log(req.query);
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const doc = await features.query;
    // const doc = await features.query.explain(); //allows search for totaldocs

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length,
      requestedAt: req.requestTime,
      data: {
        data: doc
      }
    });

    // try {
    // } catch (err) {
    //   //we should never get this error, unless their a major a error, e.i. database is down
    //   res.status(400).json({
    //     status: 'fail',
    //     message: err
    //     //err.message
    //   });
    // }
  });
};

/* exports.deleteTour = catchAsync(async (req, res, next) => {
  // try {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
}); */
