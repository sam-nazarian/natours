/* eslint-disable */

// whatever we put into a data attribute like this (data-locations=''), will then get stored into the dataset property,
// and in this case dataset.locations.

const locations = JSON.parse(document.getElementById('map').dataset.locations);

console.log(locations);
