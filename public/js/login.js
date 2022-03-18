/* eslint-disable */

const login = async (email, password) => {
  // console.log(email, password);
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email: email, //our endpoints expeccts data to be an 'email' & 'password'
        password: password
      }
    });

    // console.log(res); //prints 200 message
    //res has an object called data, all data's from api are hold there
    if (res.data.status === 'success') {
      alert('Logged in successfully!');

      //immediately go to homePage
      location.assign('/');

      //go to home page after 1.5 seconds
      // window.setTimeout(() => {
      //   location.assign('/');
      // }, 1500);
    }
  } catch (err) {
    alert(err.response.data.message);
    // console.log(err.response.data); //can be found in axios documentation, displays our api's errors
  }
  // console.log(eres);
};

document.querySelector('.form').addEventListener('submit', (e) => {
  e.preventDefault(); //prevent form to load any other page
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  login(email, password);
});
