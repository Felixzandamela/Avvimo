const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Promotions = new Schema({
  src:{
    type:String,
    required:false
  },
  name:{
    type: String,
    required:true
  },
  percentage:{
    type: Number,
    required:true
  },
  dates:{
    type: String,
    required: true,
    default:"2 04-07"
  }
});
mongoose.model("promotions", Promotions);

