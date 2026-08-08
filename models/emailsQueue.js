const mongoose = require('mongoose');
const Schema = mongoose.Schema;
  
const EmailsQueue = new Schema({
  _ids:{
    type: Array,
    required: false,
    default: []
  },
  subject:{
    type: String,
    required: true,
    default: "Olá"
  },
  text:{
    type: String,
    required: true,
    default:""
  }
})
mongoose.model("emailsQueue", EmailsQueue);
