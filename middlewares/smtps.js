const express = require("express");
require("../models/smtps");
const path = require('path');
const mongoose = require('mongoose');
const Smtps = mongoose.model('smtps');
module.exports.noreplySmtp = async function(){
  const smtp = null; // await Smtps.findOne({name: "no_reply"}).exec();

  if(!smtp){
    return {
      service: 'gmail',
      host: 'smtp.gmail.com',
      auth: {
        user: 'fifthlarmess@gmail.com',
        pass: 'rukisaxqeulmetug'
      }
    }
    
  }else{
    
    return {
      service: smtp.service,
      host: smtp.host,
      auth:{
        user: smtp.username,
        pass: smtp.password
      }
    }
  }
}
  

// use a template file with nodemailer
module.exports.handlebarOptions = function(){
  return{
    viewEngine:{
      partialsDir: path.resolve('./views/'),
      defaultLayout: false,
    },
    viewPath: path.resolve('./views/'),
  }
}

