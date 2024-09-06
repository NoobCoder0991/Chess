const nodemailer = require('nodemailer');
const fs = require('fs')
const pug = require('pug');
const path = require('path');

require('dotenv').config();

const email = process.env.EMAIL;
const password = process.env.PASSWORD;

function generateURL(length) {
  const template =
    "0123456789QWERTYUIOPASDFGHJKLMNBVCXZqwertyuioplkjhgfdsazxcbnm";
  let url = "";
  for (let i = 0; i < length; i++) {
    url += template[Math.floor(template.length * Math.random())];
  }
  return url;
}

function generateToken(length) {
  const template =
    "0123456789QWERTYUIOPASDFGHJKLMNBVCXZqwertyuioplkjhgfdsazxcbnm";
  let url = "";
  for (let i = 0; i < length; i++) {
    url += template[Math.floor(template.length * Math.random())];
  }
  return url;

}


function generateCode(len) {
  let code = "";
  for (let i = 0; i < len; i++) {
    let rand = Math.floor(10 * Math.random());
    code += rand.toString();
  }

  return code
}



async function sendEmail(recepientEmail, subject, content) {
  try {
    let transporter = nodemailer.createTransport({
      service: 'outlook',
      auth: {
        user: email, // Your Outlook email address
        pass: password // Your Outlook password
      }
    });

    let mailOptions = {
      from: email, // Sender address
      to: recepientEmail, // List of receivers
      subject: subject, // Subject line
      html: content // HTML body
    };

    // Send mail with defined transport object
    let info = await transporter.sendMail(mailOptions);
    console.log('Email sent!');
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error; // Rethrow the error for the caller to handle
  }
}



async function sendOTP(email, username, otp) {
  const filePath = path.join(__dirname, '/views/email_template.pug');

  try {

    const content = fs.readFileSync(filePath, "utf-8");
    const subject = 'PiChess code for email verification!'
    const inputData = {
      username, otp
    }
    const compiledFunction = pug.compile(content);


    const renderedContent = compiledFunction(inputData);

    const responce = await sendEmail(email, subject, renderedContent);
    return responce;
  }
  catch (err) {
    console.log("error")
    // throw new Error("Error:", err);
  }
}

async function sendAccountDetails(email, username, password) {
  const filePath = path.join(__dirname, '/views/account_details_template.pug');


  try {
    const inputData = { username: username, password: password }

    const content = fs.readFileSync(filePath, "utf-8");
    const subject = 'PiChess Account Details!'

    const compiledFunction = pug.compile(content);

    const renderedContent = compiledFunction(inputData);

    const responce = await sendEmail(email, subject, renderedContent);
    return responce;
  }
  catch (err) {
    console.log("Error", err)
  }

}

function getDate() {
  const currentDate = new Date();
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  const formattedDate = currentDate.toLocaleDateString('en-US', options);

  return formattedDate;

}

module.exports = { generateURL, generateCode, sendEmail, sendOTP, sendAccountDetails, generateToken, getDate };
