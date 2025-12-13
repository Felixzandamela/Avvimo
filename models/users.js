const mongoose = require('mongoose');
const {getTime} = require('../middlewares/utils');
const Schema = mongoose.Schema;
  
const Users = new Schema({
  balance:{
    type:Number,
    required: false,
    default:0
  },
  name:{
    type:String,
    required: true,
  },
  src:{
    type:String,
    required: false,
    default:"/imgs/avatar.png"
  },
  phoneNumber:{
    type:Number,
    required:false,
  },
  location:{
    type:String,
    required:false
  },
  agent:{
    type:String,
    required:false
  },
  email:{
    type: String,
    required:true
  },
  password:{
    type:String,
    required:true
  },
  isBanned:{
    type:Boolean,
    required:true,
    default:false
  },
  verified:{
    type:Boolean,
    required:true,
    default:false
  },
  isAdmin:{
    type:Boolean,
    required:true,
    default:false
  },
  online:{
    type:Boolean,
    required:false,
    default:false
  },
  upline:{
    type: Schema.Types.ObjectId,
    required: false,
    ref:"users"
  },
  date:{
    type: Array,
    required: true,
    default:getTime().fullDate
  },
  requestchangesdate:{
    type: Array,
    require: false,
  },
  cronTodelete:{
    type:Array,
    require:false
  }
});
mongoose.model("users", Users);