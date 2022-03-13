class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; //type of error(operational or programming)

    Error.captureStackTrace(this, this.constructor); //stack trays (https://lucasfcosta.com/2017/02/17/JavaScript-Errors-and-Stack-Traces.html)
  }
}

module.exports = AppError;
