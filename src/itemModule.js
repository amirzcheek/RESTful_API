const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const itemSchema = new Schema({
  item_Id: {
    type: Number,
    required: true,
    unique: true
  },
  pictures: {
    picture1: String,
    picture2: String,
    picture3: String
  },
  names: {
    nameEN: {
      type: String,
      required: false
    },
    nameRU: {
      type: String,
      required: false
      },
  },
  descriptions: {
    descriptionEN: {
      type: String,
      required: false
    },
    descriptionRU: {
      type: String,
      required: false
    },
  },
  timestamps: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    deletedAt: {
      type: Date,
      default: null
    }
  }
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
