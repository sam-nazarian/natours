import { showAlert } from './alerts';
const axios = require('axios'); //both import & require work
// import axios from 'axios';

// type is either 'password' or 'data'
export const updateSettings = async function(data, type) {
  try {
    const url = type === 'password' ? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword' : 'http://127.0.0.1:3000/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data
    });

    //res has an object called data, all data's from api are hold there
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully!`);

      // no need to reload as user already changed value to updated value
      // location.assign('/me');
    }
  } catch (err) {
    showAlert('error', err.response.data.message); //accessing message property from server
  }
};
