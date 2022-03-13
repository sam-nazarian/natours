/* const funcOne = function() {
  console.log('NUMBER_ONE');
  return (funcTwo = function() {
    console.log('NUMBER_TWO');
    return (funcThree = function() {
      console.log('NUMBER_THREE');
    });
  });
};

const x = funcOne();
const y = x();
y(); */

const catchAsync = function(fn) {
  console.log('inside catchAsync');
  return function() {
    console.log('Inside returned function of catchAsync');
    fn(); //value of x was replaced before, when it was in closure, hence this prints 'WORKS??'
  };
};

const newOne = function() {
  const x = 'WORKS??';
  console.log('inside newOne');
  //returning means this func will get it's returned part in func
  // Returned value is result of a function

  //returns, the return value of catchAsync
  return catchAsync(() => {
    console.log(x); //works cause, closures
  }); //needs to be a return here
};

const x = newOne();
console.log(x);
x();
