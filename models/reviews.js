const mongoose = require('mongoose');
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
    default:true
  },
  date:{
    type: Array,
    required: true
  },
  text:{
    type:String,
    required:true
  }
});
mongoose.model("reviews", Reviews);