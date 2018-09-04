const mongoose = require('mongoose')
Schema = mongoose.Schema;

// create Item Schema & Model
const ItemSchema = new Schema({
  inputText: {
    type: String,
    required: [true, 'input field is required']
  },
  translatedText: {
    type: String,
    required: [true, 'translated field is required']
  },
  targetTranslation: {
    type: String,
    required: [true, 'targetTranslation field is required']
  },
  targetSpeech: {
    type: String
  },  
  inputSpeechUrl: {
    type: String,
    required: [true, 'inputSpeechUrl field is required']
  },
  translatedSpeechUrl: {
    type: String,
  },  
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'parent',
    index: true,
    required: [true, 'parentId field is required']
  }
},{timestamps: true});

const Item = mongoose.model('item', ItemSchema);
module.exports = Item;
