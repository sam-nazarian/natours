const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  // const value = err.message.match(/"(.*?)"/)[1]; //selecting duplicate value name between quotes, value is array selecting 1st el
  const value = err.keyValue.name;
  const message = `Duplicate field value: [${value}]. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const message = `Please correct the following errors: ${err.message}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  const message = `Invalid token. Pleas log in again!`;
  return new AppError(message, 401);
};

const handleJWTExpiredError = () => {
  const message = 'Your token has expired! Please log in again.';
  return new AppError(message, 401);
};

//Operational & Programming errors are same in dev mode
const sendErrorDev = (err, req, res) => {
  // A: API
  if (req.originalUrl.startsWith('/api')) {
    //originalUrl is url without host
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  // B: RENDERED WEBSITE
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
};

const sendErrorProd = (err, req, res) => {
  // A: API
  if (req.originalUrl.startsWith('/api')) {
    // I: Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // II: Programming or other unkown error: don't leak error details
    console.error('ERROR 💥', err);
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong, please try again later!'
    });
  }

  // B: RENDERED WEBSITE
  if (err.isOperational) {
    // I: Operational, trusted error: send message to client
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }

  // II: Programming or other unkown error: don't leak error details
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Something went very wrong, please try again later!'
  });
};

module.exports = (err, req, res, next) => {
  // console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
    // console.log(err);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.assign(err); //deep copy err

    //if the err is one of the ones below, then the error is operational, so change the error to an operational error with a new message

    //mongoDB when invalid id or value was sent (usually the case with Ids)
    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    }
    //mongoDB duplicate value error
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }
    //mongoDB validation fails
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }
    // when the user has an invalid token which is caused by the user modifying the token
    // happens when JWT verify fails in authController.protect
    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    // if verification of token in authController.protect fails due to token being expired
    if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }

    sendErrorProd(error, req, res); ////before was 'err'
  }
};
