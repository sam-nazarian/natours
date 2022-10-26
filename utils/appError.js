/*
// The "pseudocode" for the built-in Error class defined by JavaScript itself
class Error {
  constructor(message) {
    this.message = message;
    this.name = "Error"; // (different names for different built-in error classes)
    this.stack = <call stack>; // non-standard, but most environments support it
  }
}
*/
class AppError extends Error {
  // custom errors https://javascript.info/custom-errors
  constructor(message, statusCode) {
    super(message); //running constructor of Error class

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; //type of error(operational or programming)

    Error.captureStackTrace(this, this.constructor); //stack trays (https://lucasfcosta.com/2017/02/17/JavaScript-Errors-and-Stack-Traces.html)
  }
}

module.exports = AppError;
