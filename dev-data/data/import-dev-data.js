const fs = require('fs');
const mongoose = require('mongoose');
const Tour = require('./../../models/tourModel'); //Tour is a Collection
const Review = require('./../../models/reviewModel'); //Tour is a Collection
const User = require('./../../models/userModel'); //Tour is a Collection

const dotenv = require('dotenv');
dotenv.config({ path: './config.env' }); //must configure before app

//delete database info
//insert tours-simple info to database
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connection successful!'));

// READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

const insertData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false }); //validateBeforeSave, so that the passwords won't get encrypted, as they already are encrypted
    await Review.create(reviews);
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// console.log(process.argv);

if (process.argv[2] === '--import') {
  insertData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
