/* eslint-disable */
import mapboxgl from 'mapbox-gl';

export const displayMap = (locations) => {
  // pk.eyJ1Ijoic2FtYW4yMTExIiwiYSI6ImNsMHR2eGh0ZTAwbXkzYm56ODZnbjE4MTAifQ.J0W78Gpf44Rm8Wq7QMUDUQ
  mapboxgl.accessToken = 'pk.eyJ1Ijoic2FtYW4yMTExIiwiYSI6ImNsMHR2eGh0ZTAwbXkzYm56ODZnbjE4MTAifQ.J0W78Gpf44Rm8Wq7QMUDUQ';
  const map = new mapboxgl.Map({
    container: 'map', // container ID (put's map on an elm with id of 'map')
    style: 'mapbox://styles/saman2111/cl0txkvfe000614pi1vfk377a', // style URL
    scrollZoom: false
    // center: [-118.113491, 34.111745], // starting position [lng, lat]
    // zoom: 9, // starting zoom
    // interactive: false
  });

  console.log(locations);

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    //Create marker
    const el = document.createElement('div');
    el.className = 'marker'; //adding a class='marker' to the div, will be used in css

    // Add marker
    new mapboxgl.Marker({
      element: el, //DOM element used as a marker
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates) // takes an array
      .addTo(map);

    //Add popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    //extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  // map.fitBounds(bounds);

  //function that executes moving & zooming, based on the bounds which was edited in for-loop above
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};
