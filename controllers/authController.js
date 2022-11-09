const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');
const crypto = require('crypto');

/**
 * @param {String} id id of user, e.g. user._id
 * @returns Returns the JsonWebToken as string
 */
const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

/**
 *
 * @param {Object} user Document object to be sent as a response, and to get a token copy
 * @param {*} statusCode
 * @param {*} res
 */
const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  //cookie here has nothing to do with cookie-parser
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true, //cookie can't be accesed or modiefied by browser
    // secure means that cookie can only be sent on a secure (HTTPS) connection
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https' //turn secure on if heroku is using HTTPS
  };

  //send token to cookie with these options
  res.cookie('jwt', token, cookieOptions);

  // Remove Password from output
  user.password = undefined; //doesn't remove from DB, cause no save
  // await user.save({ validateBeforeSave: false });

  //sending token to client, immediately logging user
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  //creating new document/user
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
    // passwordChangedAt: req.body.passwordChangedAt
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  // console.log(url);
  await new Email(newUser, url).sendWelcome();

  // const token = signToken(newUser._id);

  //sending token to client, immediately logging user
  createSendToken(newUser, 201, req, res);
  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser
  //   }
  // });
});

exports.login = catchAsync(async (req, res, next) => {
  // console.log(req.body);
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if user exists && password is correct
  //DBemail: req.body.email
  const user = await User.findOne({ email: email }).select('+password'); //also show password
  // console.log(user);

  //password is UserPassword(password given by user), user.password is DB password(coming from user model)
  //if password NOT correct[assume default of correct/true]
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  // const token = signToken(user._id);

  createSendToken(user, 200, req, res);

  // console.log(token);

  //sending token to client, immediately log user

  // res.status(200).json({
  //   status: 'success',
  //   token: token
  // });
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() - 10 * 1000), //10 sec before from now (1000 millisec in 1 sec) this deletes cookie
    httpOnly: true //cookie can't be accesed or modiefied by browser
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  //jwt will be added to headers, this will be used for testing in POSTMAN
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    //jwt in cookie, this will be used for testing in browser, jwt because we made a cookie named jwt when logging in
    //we need cookie-parser to get cookies from browser, but not to write cookies
  } else if (req.cookies.jwt && req.cookies.jwt !== 'loggedout') {
    //authenticate users send by cookies & not only via authorization header
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }
  // console.log(token);

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //throws an error if verification fails, which then will be handled in the errorController

  // console.log(decoded);

  // 3) Check if user still exists,(user may have been deleted)
  //cause we signed via '_id' we get id from decoded
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(new AppError('The user belonging to this token no longer exist.', 401));
  }

  // 4) Check if user changes password after the token was issued (hacker could have user's token but user may have changed password)
  //iat is time JWT was issued at
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password! Please log in again.', 401));
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = freshUser; //might be usefull in future
  res.locals.user = freshUser;
  // console.log(req.user);
  next();
});

// Only for rendered pages, no errors!
// add user to res.locals, so that it can be used in pug files
exports.isLoggedIn = async (req, res, next) => {
  // 1) Getting token and check of it's there
  if (req.cookies.jwt) {
    try {
      let token = req.cookies.jwt;

      // 2) Verification token
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); //if token is not in correct format this will throw an error

      // 3) Check if user still exists,(user may have been deleted)
      //cause we signed via '_id' we get id from decoded
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 4) Check if user changes password after the token was issued (hacker could have user's token but user may have changed password)
      //iat is time JWT was issued at
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next(); //if there's an err, just go next middleware, don't show error
    }
  }
  return next();
};

//happends after protection
exports.restrictTo = (...roles) => {
  //express middleware only takes req, res, next as parameters thus we are returning a function
  return (req, res, next) => {
    //has access to roles cause, closures: roles['admin', 'lead-guide'] req.user.role='user'
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTED email
  const user = await User.findOne({ email: req.body.email }); //user is a document, by waiting we execuate the query straight away

  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordReset();
  //as we are not adding the required fields such as email & pass turn validateBeforeSave off
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    //all async funcs are promises
    /*
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    });
    */
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordRestToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending the email. Try again later!', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // console.log(hashedToken);

  const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // 2) If token has not expired, and there is user, set the new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); //validators are on, we don't user update, since validators only work with save

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT

  createSendToken(user, 200, req, res);

  // const token = signToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token
  // });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const dbUser = await User.findById(req.user._id).select('+password');

  // 2) Check if posted current password is correct
  if (!(await dbUser.correctPassword(req.body.passwordCurrent, dbUser.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If so, update password
  dbUser.password = req.body.password;
  dbUser.passwordConfirm = req.body.passwordConfirm;
  await dbUser.save();

  // 4) Log user in, send JWT
  createSendToken(dbUser, 200, req, res);
  // const token = signToken(dbUser._id);

  // res.status(200).json({
  //   status: 'success',
  //   token
  // });
});
