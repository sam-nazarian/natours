// if there's a try catch wrapped around the the err it is NOT uncaught so it won't be caught here, it will be caught in the catch section of the try
// if there's an err in an express middleware then it doesn't go here, it goes to the express error handling middleware (which has 4 parameters, (err, req, res, next) )
// for unhandled synchronous errors, works on errors in sync functions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT REJECTION! 💥 Shutting down...');
  console.log(err.name, err);
  //since these errors happen async, they have nothing to do with the server, so no need to close the server
  process.exit(1); //0 is success, 1 is uncaught exeption
});

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' }); //must configure before app

const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connection successful!'));
// console.log(app.get('env')); getting the current environment, this one is set by express
// console.log(process.env);

// START SERVER
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});

//for unhandled async errors such as promises or errors in async functions
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err);

  //shutdown gracefully (wait until all current/pending requests are finished), only then after kill the server
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully!');
  server.close(() => {
    console.log('💥 Process terminated!');
    // SIGTERM shutsdown the application, no need for process.exit()
  });
});
