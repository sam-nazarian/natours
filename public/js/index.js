/* eslint-disable */

import 'regenerator-runtime/runtime.js'; //no need to store in var, will polyfill js, will be stored in bundle
import { displayMap } from './mapbox.js';
import { login, logout } from './login.js';
import { updateData } from './updateSettings.js';

//DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');

// DELEGATIONS
if (mapBox) {
  // whatever we put into a data attribute like this (data-locations=''), will then get stored into the dataset property,
  // and in this case dataset.locations.
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault(); //prevent form to load any other page
    const email = document.getElementById('email').value; //can only get values after form was submitted
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}

if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault(); //prevent form from being submitted
    const name = document.getElementById('name').value; //can only get values after form was submitted
    const email = document.getElementById('email').value;
    updateData(name, email);
  });
}
