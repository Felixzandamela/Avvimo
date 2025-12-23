const express = require("express");
const mongoose = require('mongoose');
require("../models/users");
require("../models/fleets");
require("../models/gateways");
require("../models/deposits");
require("../models/commissions");
require("../models/withdrawals");
require("../models/reviews");
const Users = mongoose.model('users');
const Gateways = mongoose.model('gateways');
const Fleets = mongoose.model('fleets');
const Deposits = mongoose.model('deposits');
const Commissions = mongoose.model('commissions');
const Withdrawals = mongoose.model('withdrawals');
const Reviews = mongoose.model('reviews');
const {transformDatas, objRevised, flashs, propertysLength} = require('./utils');

const collections = {
  users: Users,
  fleets: Fleets,
  gateways: Gateways,
  deposits: Deposits,
  commissions: Commissions,
  withdrawals: Withdrawals,
  reviews: Reviews
}
module.exports.Actions = (function(){
  return{
    set: async function(datas,checks){
      async function saveNewItem(){
        try{
          const newItem = new collections[datas.collection](datas.data);
          const itemSaved = await newItem.save();
          if(itemSaved){
            return "success";
          }
        }catch(error){
          console.log(error);
          return "error";
        }
      }
      if(checks && propertysLength(checks) > 0){
        const item = await this.get(datas.collection,checks);
        if(item){
          return this.return("exist", "set", datas);
        }else{
          const status = await saveNewItem();
          return this.return(status,"set",datas);
        }
      }else{
        const status = await saveNewItem();
        return this.return(status,"set",datas);
      }
    },
    update: async function(id,datas){
      try{
        let item = await collections[datas.collection].findById(id);
        if(item){
          item = objRevised(item,datas.data);
          const itemSaved = await item.save();
          if(itemSaved){
            return this.return("success","update",datas);
          }
        }else{return this.return("error","empty",datas);}
      }catch(error){
        console.log(error);
        return this.return("error","update",datas);
      }
    },
    increment: async function(collection,id,key,val){
      try{
        const item = await collections[collection].findOneAndUpdate({_id: id},{$inc : {key : val}}, {new: true}).exec();
        if(item){ return true;}
      }catch(error){
        console.log(error);
        return false;
      }
    },
    decrement: async function(collection,id,key,val){
      try{
        const item = await collections[collection].findOneAndUpdate({_id: id},{$dec : {key : val}}, {new: true}).exec();
        if(item){ return true;}
      }catch(error){
        console.log(error);
        return false;
      }
    },
    delete: async function(id,datas){
      try{
        const item = await collections[datas.collection].findById(id).exec();
        if(item){
          const populeteFrom = datas.collection.slice(1,-1);
          const itemsToDelete = [], itemsCollections = [];
          const deposits = await this.get("deposits",null,datas.collection);
          if(typeof deposits != "string"){
            const arrayOfDeposits = [], arrayOfCommissions = [];
            for(let d in deposits){
              if(deposits[d][datas.collection = "users"? "owner" :populeteFrom] == item._id){
                arrayOfDeposits.push(deposits[d]._id);
                const commission = await Commissions.findOne({from:deposits[d]._id}).exec();
                if(commission){
                   arrayOfCommissions.push(commission._id);
                }
              }
              itemsToDelete.push(arrayOfCommissions,arrayOfDeposits);
              itemsCollections.push("commissions","deposits");
            }
          }
          if(datas.collection == "gateways"){
            const arrayOfWithdrawals = [];
            const withdrawals = await this.get("withdrawals",null,datas.collection);
            if(withdrawals != "string"){
              for(let w in withdrawals){
                if(withdrawals[w][datas.collection = "users"? "owner" :populeteFrom] == item._id){
                  arrayOfWithdrawals.push(withdrawals[w]._id);
                }
              }
              itemsToDelete.push(arrayOfWithdrawals);
              itemsCollections.push("withdrawals");
            }
          }
          if(datas.collection == "users"){
            const review = await this.get("reviews",{owner:id});
            if(review){
              itemsToDelete.push([review._id]);
              itemsCollections.push("reviews");
            }
          }
          itemsToDelete.push(item._id);
          itemsCollections.push(datas.collection);
          for(let a in itemsToDelete){
            if(itemsToDelete[a].length <= 0){
              continue;
            }else{
              const deleteItems = await this.deleteMany(itemsCollections[a],itemsToDelete[a]);
            }
          }
          return this.return("success","delete",datas);
        }else{
          return this.return("empty","delete",datas);
        }
      }catch(error){
        console.log(error);
        return this.return("error","delete",datas);
      }
    },
    deleteMany: async function(collection,items){
      try{
        const result = collections[collection].deleteMany({_id:{ $in: items}});
        console.log(result);
        return true;
      }catch(error){
        console.log(error);
        return false;
      }
    },
    get: async function(collection,query,populete){
      const findBy = typeof query == "object" ? "findOne" : typeof query == "string" ? "findById" : "find";
      let items;
      try{
        if(!collection){
          return "error";
        }else{
          switch(populete){
            case typeof populete == "string":
              if(query){
                items = await collections[collection][findBy](query).populete(populete).exec();
              }else{
                items = await collections[collection][findBy]().populete(populete).exec();
              }
            break;
            default:
              if(query){
                items = await collections[collection][findBy](query).exec();
              }else{
                items = await collections[collection][findBy]().exec();
              }
            break;
          }
        }
        if(items || typeof items == "array" && !items.length === 0){return items;}else{return null}
      }catch(error){
        console.log(error);
        return null;
      }
    },
    return:function(e,t,d){
      return{
        type: /^(exist|empty)/i.test(e) ? "error" : e,
        text: flashs(e,t,d.collection),
        redirect: d.redirect
      }
    }
  }
})();