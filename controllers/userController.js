const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel'); //User is a Collection
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

//image will be stored as a buffer & not to the memory
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

//name of field in html that will hold the file is photo & will be only having a single photo
exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  //as we used buffer in memory it din't add a name to the file
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  //image processing
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

/**
 * see if values are available in the object
 * @param {Object} obj see if these
 * @param  {...Strings} allowedFields allowed values
 * @returns
 * returns object with allowedfields
 */
const filterObj = (bodyObj, ...allowedFields) => {
  const newObj = {};
  //allowFields becomes an array
  Object.keys(bodyObj).forEach((el) => {
    if (allowedFields.includes(el)) {
      //if key is not found create key, if key is found get value
      newObj[el] = bodyObj[el];
      // key     = value
    }
  });
  return newObj;
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'failed',
    //errors need message, successs needs data
    message: 'This route is not defined! Please use /signup instead'
  });
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log('req.file: ', req.file);
  // console.log('req.body: ', req.body);

  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError(`This route is not for password updates. Please use /updateMyPassword`, 400));
  }

  // 2) Filtered out unwanted fields name that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;
  // console.log(filteredBody);

  // 3) update user document
  const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, //returns new object
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updateUser
    }
  });
});

//protect happends before this
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Set param id as the factory function wouldn't work without it
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// USER ROUT HANDLERS / CONTROLERS
exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

// Do NOT update passwords with this! it has updateFind, so doesn't work with 'save'
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
