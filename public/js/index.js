/* eslint-disable */

import 'regenerator-runtime/runtime.js'; //no need to store in var, will polyfill js, will be stored in bundle
import { displayMap } from './mapbox';
import { login, logout } from './login';

//DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form');
const logOutBtn = document.querySelector('.nav__el--logout');

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
