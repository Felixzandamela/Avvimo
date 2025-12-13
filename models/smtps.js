
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Smtps = new Schema({
  name:{
    type: String,
    required: true,
  },
  service:{
    type: String,
    required:true,
  },
  host:{
    type: String,
    required:true
  },
  auth:{
    user:{
      type:String,
      required:true
    },
    password:{
      type:String,
      required:true
    }
  }
});


mongoose.model("smtps", Smtps);