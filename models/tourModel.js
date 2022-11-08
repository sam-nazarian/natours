const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./userModel');

//Schema is a constructor which takes a parameter of an object, that's why we do 'new'
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [40, 'A tour name must have less or equal then 40 characters'],
      minLength: [10, 'A tour name must have more or equal then 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'] //custom validator
      validate: {
        validator: function(value) {
          return validator.isAlpha(value, 'en-US', { ignore: ' ' }); //removes spaces in text
        },
        message: 'Tour name must only contain characters.'
      }
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10 // 4.66666 46.6666, 47, 4.7 rounds to closer integer(NOT decimal)
    },
    ratingsQuantity: {
      type: Number,
      default: 0
      //user doesn't need to enter these data, so not required
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,

      //Custom validator, could do validate: [<<func>>, 'error message']
      validate: {
        validator: function(val) {
          //'this' only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'] //when not on front page of website, not required
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    //
    startLocation: {
      // GeoJSON - must have type and coordinates
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number], //must have coordinates
      address: String,
      description: String
    },
    //embedded document, each documnet gets a unique id
    /*
    Whenever you define an object in an array, Mongoose creates a schema for it behind the scenes so it treats it as a subdocument. A consequence of this is that Mongoose will add an _id field to each object.
    */
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    // guides: Array //contains userId's
    //subDocument inside array (child referencing, tour references User)
    guides: [
      {
        type: mongoose.Schema.ObjectId, //mongoDB id
        ref: 'User' //can set ref to a model name, (referencing child which is user)
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
    // id: false //stops getting 2 different ids, with names: 'id' & '_id'
  }
);

//indexes makes getting results faster
tourSchema.index({ price: 1, ratingsAverage: -1 }); //'1':acsending, '2':descending
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' }); //allows geospatial queries for startLocation

//return is <<VirtualType>> obj, use get() on it
//VirtualType.prototype.get()
//doc: the document this virtual is attached to. Equivalent to this.
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

//DOCUMENT MIDDLEWARE: runs before .save() and .create() (emits 'save' event)
tourSchema.pre('save', function(next) {
  // console.log(this); //'this' points to created document
  this.slug = slugify(this.name, { lower: true });
  next();
});

//Virtual Populate, creates reviews[] on TourSchema
tourSchema.virtual('reviews', {
  //_id in localField is called tour in review model
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

// Code below: embeds users into tours
// tourSchema.pre('save', async function(next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   // console.log(this.guides);
//   // this.guides = guidesPromises; //try this later
//   next();
// });

// tourSchema.pre('save', function(next) {
//   console.log('Will save document...');
//   next();
// });

// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE:
//all strings that start with find (i.e works for findOne aswell)
tourSchema.pre(/^find/, function(next) {
  // tourSchema.pre('find', function(next) { // works for find not find one
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

/*
tourSchema.post(/^find/, function(docs, next) {
  // console.log(`Query took: ${Date.now() - this.start} milliseconds`);
  // console.log('BELOW IS DOCS:');
  // console.log(docs);
  // console.log('BELOW IS THIS:');
  // console.log(this);
  next();
});
*/

//also works for find by id
tourSchema.pre(/^find/, function(next) {
  //'this' points to current query

  this.populate({
    path: 'guides',
    select: '-__v' //-passwordChangedAt
  });

  next();
});

//AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function(next) {
  // console.log(this);
  //_pipeline is a private variable
  // console.log(this.__proto__.pipeline.toString()); // see if function pipeline exists
  // console.log(this.__proto__);

  // Hide secret tours in aggregation pipeline if geoNear is NOT used as 1st pipeline
  // essential as geoNear needs to be 1st item listed in an aggregation pipeline otherwise it won't work
  if (!(this.pipeline().length > 0 && '$geoNear' in this.pipeline()[0])) {
    //add to beginning of aggregation pipeline
    this.pipeline().unshift({
      $match: { secretTour: { $ne: true } }
    });
  }
  next();
});

const Tour = mongoose.model('Tour', tourSchema); //creates the collection

module.exports = Tour;
