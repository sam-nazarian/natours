const User = require('./../models/userModel'); //User is a Collection
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appError');
const factory = require('./handlerFactory');

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
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new appError(`This route is not for password updates. Please use /updateMyPassword`, 400));
  }

  // 2) Filtered out unwanted fields name that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  console.log(filteredBody);

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
