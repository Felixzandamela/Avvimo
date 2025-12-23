const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Images = new Schema({
  src:{
    type:String,
    required:false,
    default:""
  },
  owner:{
    type: Schema.Types.ObjectId,
    required: true,
    ref:"users"
  }
});
mongoose.model("images", Images);