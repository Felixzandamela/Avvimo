const express = require('express');
const mongoose = require('mongoose');
require("../models/users");
require("../models/fleets");
require("../models/gateways");
require("../models/deposits");
require("../models/commissions");
require("../models/withdrawals");
require("../models/reviews");
require("../models/images");

const Users = mongoose.model('users');
const Gateways = mongoose.model('gateways');
const Fleets = mongoose.model('fleets');
const Deposits = mongoose.model('deposits');
const Commissions = mongoose.model('commissions');
const Withdrawals = mongoose.model('withdrawals');
const Reviews = mongoose.model('reviews');
const Images = mongoose.model('images');
const { transformDatas, objRevised, flashs, propertysLength } = require('./utils');

const collections = {
  users: Users,
  fleets: Fleets,
  gateways: Gateways,
  deposits: Deposits,
  commissions: Commissions,
  withdrawals: Withdrawals,
  reviews: Reviews,
  images: Images
};

module.exports.Actions = (function () {
  // helper to validate collection name
  function validCollection(name) {
    return Object.prototype.hasOwnProperty.call(collections, name);
  }

  return {
    // dados: { collection: 'users', data: {...}, redirect? }
    set: async function (datas, checks, callback) {
      if (!datas || !datas.collection || !validCollection(datas.collection)) {
        return this.return('error', 'set', datas || {});
      }

      const saveNewItem = async (callback) => {
        try {
          const Model = collections[datas.collection];
          const newItem = new Model(datas.data);
          const itemSaved = await newItem.save();
          if(callback){
            return itemSaved ? itemSaved : null;
          }else{
            return itemSaved ? 'success' : 'error';
          }
        } catch (error) {
          console.error('set.saveNewItem error:', error);
          return callback ? null : 'error';
        }
      };

      try {
        if (checks && propertysLength(checks) > 0) {
          const item = await this.get(datas.collection, checks);
          if (item) {
            return this.return('exist', 'set', datas);
          } else {
            const status = await saveNewItem(callback);
            return callback ? status : this.return(status, 'set', datas);
          }
        } else {
          const status = await saveNewItem(callback);
          return callback ? status : this.return(status, 'set', datas);
        }
      } catch (err) {
        console.error('set error:', err);
        return callback ? null : this.return('error', 'set', datas);
      }
    },

    update: async function (id, datas, callback) {
      if (!id || !datas || !datas.collection || !validCollection(datas.collection)) {
        return this.return('error', 'update', datas || {});
      }
      try {
        const Model = collections[datas.collection];
        let item = await Model.findById(id).exec();
        if (!item) return callback ? null : this.return('empty', 'update', datas);
        item = objRevised(item, datas.data);
        const itemSaved = await item.save();
        if (itemSaved) {
          return callback ? itemSaved : this.return('success', 'update', datas);
        }
        return callback ? null : this.return('error', 'update', datas);
      } catch (error) {
        console.error('update error:', error);
        return callback ? null : this.return('error', 'update', datas);
      }
    },

    // increment field by val (use computed property)
    increment: async function (collection, id, key, val) {
      if (!validCollection(collection)) return false;
      try {
        const update = await collections[collection].findOneAndUpdate(
          { _id: id },
          { $inc: { [key]: val } },
          { new: true }
        ).exec();
        return !!update;
      } catch (error) {
        console.error('increment error:', error);
        return false;
      }
    },

    // decrement field by val
    decrement: async function (collection, id, key, val) {
      if (!validCollection(collection)) return false;
      try {
        const update = await collections[collection].findOneAndUpdate(
          { _id: id },
          { $inc: { [key]: -Math.abs(val) } },
          { new: true }
        ).exec();
        return !!update;
      } catch (error) {
        console.error('decrement error:', error);
        return false;
      }
    },

    // delete single item with cascades (tries to do deletes server-side, not by filtering in memory)
    delete: async function (id, datas) {
      if (!id || !datas || !datas.collection || !validCollection(datas.collection)) {
        return this.return('error', 'delete', datas || {});
      }

      const Model = collections[datas.collection];
      try {
        const item = await Model.findById(id).exec();
        if (!item) return this.return('empty', 'delete', datas);

        const itemsToDelete = [];
        const itemsCollections = [];

        // Cascade deletes should be done with queries rather than fetching all rows and filtering in JS
        // Example: delete deposits where owner === item._id (if collection relates to deposits by owner)
        if (datas.collection === 'users' || datas.collection === 'fleets' || datas.collection === 'gateways') {
          // Determine field name in deposits that references this collection.
          // Assuming convention: deposits.owner (for users) or deposits.fleet (for fleets) etc.
          // Adjust field mapping as per schema.
          const fieldMap = {
            users: 'owner',
            fleets: 'fleet',
            gateways: 'gateway'
          };
          const refField = fieldMap[datas.collection] || null;
          if (refField) {
            // delete commissions related to these deposits (commissions.from => deposit id)
            const depositsToDelete = await Deposits.find({ [refField]: item._id }).select('_id').lean().exec();
            const depositIds = depositsToDelete.map(d => d._id);
            if (depositIds.length > 0) {
              itemsToDelete.push(depositIds);
              itemsCollections.push('deposits');

              const commissionsToDelete = await Commissions.find({ from: { $in: depositIds } }).select('_id').lean().exec();
              const commissionIds = commissionsToDelete.map(c => c._id);
              if (commissionIds.length > 0) {
                itemsToDelete.push(commissionIds);
                itemsCollections.push('commissions');
              }
            }
          }
        }

        // For gateways, also remove withdrawals linked to that gateway (example)
        if (datas.collection === 'gateways') {
          const withdrawalsToDelete = await Withdrawals.find({ gateway: item._id }).select('_id').lean().exec();
          const withdrawalIds = withdrawalsToDelete.map(w => w._id);
          if (withdrawalIds.length > 0) {
            itemsToDelete.push(withdrawalIds);
            itemsCollections.push('withdrawals');
          }
        }

        // If deleting a user, remove reviews authored by user
        if (datas.collection === 'users') {
          const reviewsToDelete = await Reviews.find({ owner: item._id }).select('_id').lean().exec();
          const reviewIds = reviewsToDelete.map(r => r._id);
          if (reviewIds.length > 0) {
            itemsToDelete.push(reviewIds);
            itemsCollections.push('reviews');
          }
        }

        // finally delete the main item
        itemsToDelete.push([item._id]);
        itemsCollections.push(datas.collection);

        // execute deletes (could be wrapped in transaction if using replica set)
        for (let i = 0; i < itemsToDelete.length; i++) {
          const col = itemsCollections[i];
          const ids = itemsToDelete[i];
          if (!ids || ids.length === 0) continue;
          await this.deleteMany(col, ids);
        }

        return this.return('success', 'delete', datas);
      } catch (error) {
        console.error('delete error:', error);
        return this.return('error', 'delete', datas);
      }
    },

    deleteMany: async function (collection, items) {
      if (!validCollection(collection)) {
        console.error('deleteMany invalid collection:', collection);
        return false;
      }
      try {
        const result = await collections[collection].deleteMany({ _id: { $in: items } }).exec();
        // result is a DeleteResult: { deletedCount, ... }
        return true;
      } catch (error) {
        console.error('deleteMany error:', error);
        return false;
      }
    },

    // get(collection, query, populate)
    // query: undefined -> find all
    // query: string -> findById
    // query: object -> find (many)
    // populate: string field to populate
    get: async function (collection, query, populate, one) {
      if (!collection || !validCollection(collection)) {
        return null;
      }
      const Model = collections[collection];

      try {
        let items;
        const shouldPopulate = Array.isArray(populate) && populate.length > 0;

        if (query === undefined || query === null) {
          items = shouldPopulate ? await Model.find().populate(populate).exec() : await Model.find().exec();
        } else if (typeof query === 'string' || typeof query === 'number') {
          items = shouldPopulate ? await Model.findById(query).populate(populate).exec() : await Model.findById(query).exec();
        } else if (typeof query === 'object') {
          // treat as filter for many results
          items = shouldPopulate ? await Model.find(query).populate(populate).exec() : await Model.find(query).exec();
        } else {
          return null;
        }

        // return null if empty array or not found
        if (!items) return null;
        if (Array.isArray(items) && items.length === 0) return null;
        return one ? items[0] : items;
      } catch (error) {
        console.error('get error:', error);
        return null;
      }
    },
    
    aggregate: async function(collection, match, field){
      if (!validCollection(collection)) {
        console.error('aggregate invalid collection:', collection);
        return false;
      }
      if(typeof match !== "object" || !field){
        console.error('aggregate matchs undefined:', match, field);
        return false
      }
      try{
        const Model = collections[collection];
        const result = await Model.aggregate([
          { $match: match},
          { $group: {
            _id: null,
            total: { $sum: field },
            count: { $sum: 1 }
          }
        }]).exec();
        if(result){
          return result[0];
        }
      } catch (error) {
        console.error('aggregate error:', error);
        return false;
      }
    },
    
    return: function (e, t, d) {
      return {
        type: /^(exist|empty)/i.test(e) ? 'error' : e,
        text: flashs(e, t, d.collection),
        redirect: d.redirect
      };
    }
  };
})();