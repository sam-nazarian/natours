// type is 'sccess or 'error'

export const hideAlert = () => {
  const el = document.querySelector('.alert');
  // if (el) el.parentElement.removeChild(el);
  if (el) el.remove();
};

/**
 *
 * @param {string} type can be 'error' or 'success' as it's refered to in css
 * @param {string} msg massage of popup
 */
export const showAlert = (type, msg) => {
  hideAlert(); //hide elm that already exist, incase prev elm didn't disapear in time
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup); //inside of the body, but right at the beginning
  window.setTimeout(hideAlert, 5000); //hide alert after 0.5 sec
};
