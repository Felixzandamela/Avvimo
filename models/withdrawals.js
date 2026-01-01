const mongoose = require('mongoose');
const Schema = mongoose.Schema;
  
const Withdrawals = new Schema({
  owner:{
    type: Schema.Types.ObjectId,
    required: true,
    ref:"users"
  },
  amount:{
    type:Number,
    required: true,
  },
  totalReceivable:{
    type:Number,
    required: true,
  },
  fees:{
    type:Number,
    required: true,
    default:0
  },
  status:{
    type: String,
    required:true,
    default:"Pendente"
  },
  account:{
    type:Number,
    required:true,
    default:"cashback"
  },
  gateway:{
    type: Schema.Types.ObjectId,
    required: true,
    ref:"gateways"
  },
  date:{
    type: Array,
    required: true
  }
});
mongoose.model("withdrawals", Withdrawals);