const nodemailer = require('nodemailer');

/**
 * @param {object} options object with properties of 'email', 'subject', 'message'
 */
const sendEmail = async (options) => {
  //1) Create a transporter

  const transporter = nodemailer.createTransport({
    //using mailtrap for practise
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'Saman Fathnazarian(owner) <admin@fathnazarian.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
    //html
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
