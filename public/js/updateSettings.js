import { showAlert } from './alerts';
// import axios from 'axios';
const axios = require('axios'); //both import & require work

export const updateData = async function(name, email) {
  try {
    const res = await axios({
      method: 'PATCH',
      url: 'http://127.0.0.1:3000/api/v1/users/updateMe',
      data: {
        name: name,
        email: email
      }
    });

    //res has an object called data, all data's from api are hold there
    if (res.data.status === 'success') {
      showAlert('success', 'Data updated successfully!');

      // no need to reload as user already changed value to updated value
      // location.assign('/me');
    }
  } catch (err) {
    showAlert('error', err.response.data.message); //accessing message property from server
  }
};
