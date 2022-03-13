const Tour = require('./../models/tourModel'); //Tour is a Collection/model
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

exports.alias = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// TOUR ROUT HANDLERS / CONTROLERS

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' }); //poopulate reviews
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour); //patch updates part of data, put replaces data with new data
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  // try {
  const stats = await Tour.aggregate([
    {
      $match: { duration: { $gte: 1 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 }, //for each doc 1 added to numTours
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 } //old names no longer exist, (1 ascending)
    },
    {
      $match: { _id: { $ne: 'EASY' } } //id is now difficulty
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err
  //   });
  // }
});

//startDates in a certain year
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  // try {
  const year = req.params.year;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`), //same idea: $match: { startDates: { $gte: yea1 , $lte: year2} }
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' } //an array
      }
    },
    {
      $addFields: { month: '$_id' } //field 'month' with value of '$_id'
    },
    {
      $project: {
        _id: 0 //hiding _id
      }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: fail,
  //     message: err
  //   });
  // }
});

// /tours-within/233/center/-40,35/unit/mi
// /tours-distance?distance=233&center=-40,45&unit=mi //another way
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(new AppError('Please provide latitutr and longitude in the format lat,lng.', 400));
  }

  console.log(distance, lat, lng, unit);

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    numbeOfResults: tours.length,
    data: {
      data: tours
    }
  });
});

/**
 * Sorts tours, displays closest one to coordinate
 */
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001; //1 meter in miles is '0.000621371' , 1 meter in km is 0.001

  if (!lat || !lng) {
    next(new AppError('Please provide latitutr and longitude in the format lat,lng.', 400));
  }

  const distances = await Tour.aggregate([
    {
      //geoNear must be first stage in aggregation pipeline
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1] //convert to num
        },
        distanceField: 'distance', //name of field, where calculated distances will be stored
        distanceMultiplier: multiplier //multiplies with distance, converts it from meter to km
      }
    },
    {
      //only showing certain fields, if commented shows all fields
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});
