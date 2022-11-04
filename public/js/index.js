/* eslint-disable */

import 'regenerator-runtime/runtime.js'; //no need to store in var, will polyfill js, will be stored in bundle
import { displayMap } from './mapbox.js';
import { login, logout } from './login.js';
import { updateSettings } from './updateSettings.js';

//DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');

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

    //recreating multi-part form data
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    console.log(form);

    updateSettings(form, 'data'); //ajax call will recognise this file as an object
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault(); //prevent form from being submitted

    document.querySelector('.btn--save-password').textContent = 'Updating...'; //only forms have the value property on them, not all html elms

    const passwordCurrent = document.getElementById('password-current').value; //can only get values after form was submitted
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings({ passwordCurrent, password, passwordConfirm }, 'password');

    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}
