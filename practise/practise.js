const course = {
  teacher: 'james',
  grade: 1000,
};

const grade = {
  grade: 50,
};

console.log('first', course);
console.log('first', grade);

const final = Object.assign(course, grade);

console.log('second', course);
console.log('second', grade);

console.log('final', final);

myArray = [
  {
    name: 'james',
    lastname: 'hasany',
  },
  {
    name: 'james',
    lastname: 'hasany',
  },
  {
    name: 'james',
    lastname: 'hasany',
  },
];

myarray = [1, 2, 3, 4];

/*
app.patch('/api/v1/tours/:id', (req, res) => {
  //we are getting req from client, res is being sent to client
  const id = Number(req.params.id);

  //get the object that matched the id
  const tour = tours.find((element) => {
    return element.id === id;
  });
  console.log(tour);

  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'id could not be found',
    });
  }

  console.log(typeof tour);
  console.log(req.body);

  tour[req.body];

  //see match between req.body and json info
  //update change

  res.status(200).json({
    status: 'success',
    data: {
      tour: 'this message for now',
    },
  });
});
*/
