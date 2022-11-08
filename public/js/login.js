/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';
// const axios = require('axios');

export const login = async (email, password) => {
  // console.log(email, password);

  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login', // adds to current host url
      data: {
        email: email, //our endpoints expeccts data to be an 'email' & 'password'
        password: password
      }
    });

    // console.log(res); //prints 200 message
    //res has an object called data, all data's from api are hold there
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');

      //immediately go to homePage
      location.assign('/');

      //go to home page after 1.5 seconds
      // window.setTimeout(() => {
      //   location.assign('/');
      // }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
    // console.log(err.response.data); //can be found in axios documentation, displays our api's errors
  }
  // console.log(eres);
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout'
    });
    if ((res.data.status = 'success')) location.reload(true); //reloads page from server, does not store data cached by browser
  } catch (err) {
    showAlert('error', 'Error logging out! Try again.');
  }
};
