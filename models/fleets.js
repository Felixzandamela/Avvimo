const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Fleets = new Schema({
  src: {
    type: String,
    required: false,
    ref: "images",
  },
  name:{
    type: String,
    required: true,
  },
  
  maturity:{
    type: Number,
    required: true
  },
  percentage:{
    type: Number,
    required: true
  },
  max:{
    type: Number,
    required: true
  },
  min:{
    type: Number,
    required: true
  },
  status:{
    type: Boolean,
    required:true,
    default:true
  },
  distac:{
    type: Boolean,
    required:false,
    default: false
  }
});


mongoose.model("fleets", Fleets);