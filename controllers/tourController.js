const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel'); //Tour is a Collection/model
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

// for single uploads
// upload.single('image'); req.file

//for multiple uploads, with 1 field
// upload.array('images', 3); req.files

//for multiple uploads, with many fields
exports.uploadTourImages = upload.fields([{ name: 'imageCover', maxCount: 1 }, { name: 'images', maxCount: 3 }]); //req.files

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);
  if (!req.files.imageCover || !req.files.images) return next();

  // 1: Cover image
  //on database field is called imageCover
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2: Images
  req.body.images = [];

  //async callback function returns a promise, which then would need to be awaited
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  console.log(req.body);
  next();
});

exports.alias = (req, res, next) => {
  //req.query is url's querys
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
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      //deconstructs an array field from the info documents and then output one document for each element of the array.
      $unwind: '$startDates'
    },
    // match is like filter
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`), //same idea: $match: { startDates: { $gte: yea1 , $lte: year2} }
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      //columns that the match will have
      $group: {
        _id: { $month: '$startDates' }, //groups data that have the same month
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' } //an array (specify 2 or more tours in 1 field)
      }
    },
    // adding a field with _id value to change original name of ID
    {
      $addFields: { month: '$_id' } //field 'month' with value of '$_id'
    },
    // hiding the value ID, as we added it with a different name above
    {
      $project: {
        _id: 0 //hiding _id (0 is hiding, 1 is showing)
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

// /tours-within/233/center/-40,35/unit/mi|km
// /tours-within?distance=233&center=-40,45&unit=mi //another way
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; //convert to radians unit

  if (!lat || !lng) {
    next(new AppError('Please provide latitude and longitude in the format lat,lng.', 400));
  }

  console.log(distance, lat, lng, unit);

  const tours = await Tour.find({
    //geoWithin finds documents between a geometry
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
      // for geospatial aggregation geoNear must be first stage in aggregation pipeline
      // needs to have golocation index for it to work, by default uses the only geolocation index (so here it's startLocation)
      // distance between startLocation & given coordinate(by user)
      // results will automatically be sorted by distance in asc
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
