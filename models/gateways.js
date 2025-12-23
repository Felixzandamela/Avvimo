const {getTime} = require('../middlewares/utils');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Gateways = new Schema({
  src:{
    type:String,
    required:false
  },
  name:{
    type: String,
    required:true
  },
  account:{
    type:String,
    required:true
  },
  owner:{
    type: String,
    required: true,
  },
  paymentInstantly:{
    type:Boolean,
    default:false,
    require:false,
  },
  status:{
    type:Boolean,
    default:true,
    required:false,
  },
  date:{
    type:Array,
    required:true,
    default: getTime().fullDate
  }
});
mongoose.model("gateways", Gateways);

