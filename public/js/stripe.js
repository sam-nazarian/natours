import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  try {
    const stripe = Stripe('pk_test_51M0zeBBFhHzpgYFyUL2fdbgiIOcSEuvdUzNaRmw23JxiYf0Xs7Kcw4vyTx83FKKkCzNQqUywNXn4jh0hoLP4Z6IB00FvPJkJfj');
    // 1) Get checkout session from API
    const session = await axios(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`);
    // console.log(session);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
