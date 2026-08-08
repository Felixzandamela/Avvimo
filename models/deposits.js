const mongoose = require('mongoose');
const Schema = mongoose.Schema;
  
const Deposits = new Schema({
  owner:{
    type: Schema.Types.ObjectId,
    required: true,
    ref:"users"
  },
  amount:{
    type:Number,
    required: true,
  },
  income:{
    type:Number,
    required: true,
  },
  totalIncome:{
    type:Number,
    required: true,
  },
  fees:{
    type:Number,
    required: true,
    default:0
  },
  fleet:{
    type: Schema.Types.ObjectId,
    required: true,
    ref:"fleets"
  },
  status:{
    type: String,
    required:true,
    default:"Pendente"
  },
  account:{
    type:Number,
    required:true
  },
  gateway:{
    type: Schema.Types.ObjectId,
    required: true,
    ref:"gateways"
  },
  date:{
    type: Array,
    required: true
  },
  expireAt:{
    type:Array,
    required:true
  }
});
mongoose.model("deposits", Deposits);