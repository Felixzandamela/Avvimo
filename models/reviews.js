const mongoose = require('mongoose');
const {getTime} = require('../middlewares/utils');
const Schema = mongoose.Schema;
const Reviews = new Schema({
  owner:{
    type: Schema.Types.ObjectId,
    required: true,
    ref:"users"
  },
  stars:{
    type:Number,
    required: true,
    default:1
    },
  makePublic:{
    type:Boolean,
    required: true,
    default:false
  },
  date:{
    type: Array,
    required: true,
    default: getTime().fullDate
  },
  text:{
    type:String,
    required:true
  }
});
mongoose.model("reviews", Reviews);