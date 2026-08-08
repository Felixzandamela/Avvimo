const mongoose = require('mongoose');
const {getTime,getColor,expireDay,idGenerator} = require('../middlewares/utils');
const Schema = mongoose.Schema;
  
const Users = new Schema({
  balance:{
    type:Number,
    required: false,
    default:0
  },
  earned:{
    type:Number,
    required:false,
    default:0
  },
  name:{
    type:String,
    required: true,
  },
  src:{
    type:String,
    required: false,
    default:""
  },
  phoneNumber:{
    type:Number,
    required:false,
  },
  email:{
    type: String,
    required:true,
    lowercase:true,
    unique:true
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
  inDeleteQueue:{
    status: {
      type: Boolean,
      required: false,
      default: false,
    },
    date:{
      type:Array,
      required:false,
      default:[]
    }
  },
  bruteForce:{
    code:{
      type: String,
      required:false,
      default:""
    },
    date:{
      type:Array,
      required:false,
      default:[]
    },
    rescue:{
      type: Boolean,
      required: false,
      default: false,
    },
    active:{
      type: Boolean,
      required: false,
      default: false,
    }
  }
});
// Middleware pre-save

Users.pre('save', function(next) {
  const isRescue = this.bruteForce.rescue;
  this.bruteForce.code = isRescue? idGenerator(null,"code") : ""; 
  this.bruteForce.date = isRescue? getTime().fullDate : [];
  this.inDeleteQueue.date = this.inDeleteQueue.status ? expireDay(30) : [];
});

mongoose.model("users", Users);
