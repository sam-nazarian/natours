const express = require('express');
const viewsController = require('../controllers/viewsController');

const router = express.Router();

router.get('/', viewsController.getOverview);
router.get('/tour/:slug', viewsController.getTour);
router.get('/login', viewsController.getLoginForm);

module.exports = router;

/* app.get('/', (req, res) => {
  res.status(200).render('base', {
    tour: 'The Forest HIker',
    user: 'Saman'
  });
}); */
