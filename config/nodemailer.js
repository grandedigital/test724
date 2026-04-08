const nodemailer = require('nodemailer');

const email = "info@724chauffeur.com"
const pass = "11223344Ab**??"

const transporter = nodemailer.createTransport({
    host: 'smtpout.secureserver.net',
    port: 465,
    secure: true,
    auth: {
        user: email,
        pass: pass
    }
})

module.exports = transporter

// module.exports = ({ env }) => ({
   
//   });
  