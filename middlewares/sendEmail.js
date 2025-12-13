const express = require("express");
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const path = require('path');
const hbs = require('nodemailer-express-handlebars');
const s = require('./smtps');
const n = require('./noReplyOptions');
// sending emails
module.exports.sendEmail = async function(user, infos){
  var mailOptions = await n.noReplyOptions(user, infos);
  const no_reply = await s.noreplySmtp();
  const transporter = nodemailer.createTransport(smtpTransport(no_reply));
  transporter.use('compile', hbs(s.handlebarOptions()));
  transporter.sendMail(mailOptions, function(error, info){
    if(error){
      console.log(error);
      return false
    }
    console.log('Email sent '+ info.response);
    return true
  });
}