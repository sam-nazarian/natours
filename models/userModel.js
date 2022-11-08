const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function(value) {
        return validator.isEmail(value); //returns a true/false
      },
      message: 'Please provide a valid email'
    }
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'please provide a password'],
    minLength: 8,
    select: false //will never show in any output
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREAETE and SAVE!!! (AS IT HAS THIS KEYWORD)
      validator: function(value) {
        return value === this.password;
      },
      message: 'Passwords are not the same'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  if (process.env.NODE_ENV === 'LOADER') {
    this.isNew = true; //next 'save' middleware won't run (not needed)
    return next();
  }

  // Hash the password with cost/salt of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  //-3000 cause token might be issued after this date
  this.passwordChangedAt = Date.now() - 3000;
  next();
});

/**
 *
 * @param {string} candidatePassword Pass given by user(regular string)
 * @param {string} userPassword pass stored in DB(hashed)
 * @returns
 */
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  //password select is false so we can't select it, so param is neeed
  //compares data to hash
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = this.passwordChangedAt.getTime() / 1000;
    // console.log(JWTTimestamp, changedTimestamp);

    //JWTTimestamp is iat(token issued at date)
    //returns a true or false
    return JWTTimestamp < changedTimestamp; //10, 100
  }

  return false; //pass was never changed
};

userSchema.methods.createPasswordReset = function() {
  //reset token
  const resetToken = crypto.randomBytes(32).toString('hex');

  //encrypted resetToken
  this.passwordResetToken = crypto //'this' points to current document
    .createHash('sha256') //returns hash
    .update(resetToken) //string to be encripted
    .digest('hex'); //store as hex

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 30 * 60 * 1000; //after 30 minutes

  //must save document cause changes in DB
  return resetToken;
};

/**
 * Only Querys active documents
 */
userSchema.pre(/^find/, function(next) {
  // 'this' points to current query

  this.find({ active: { $ne: false } });
  next();
});

const User = mongoose.model('User', userSchema); //creates a collection

module.exports = User;
