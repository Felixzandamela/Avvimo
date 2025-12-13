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
    require:true,
  },
  status:{
    type:Boolean,
    default:true,
    required:true,
  },
  date:{
    type:Array,
    required:true
  }
});
mongoose.model("gateways", Gateways);

