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
  const message = 'You token has expired! Please log in again.';
  return new AppError(message, 401);
};

//bot Operational & Programming errors same in dev mode
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
    // error2: err.__proto__,
    // errCode: err.Code
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });

    // Programming or other unkown error: don't leak error details
  } else {
    // 1)Log error
    console.error('ERROR 💥', err);
    //2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }
};

module.exports = (err, req, res, next) => {
  // console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
    // console.log(err);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.assign(err); //deep copy err

    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }
    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }

    sendErrorProd(error, res); ////before was 'err'
  }
};
