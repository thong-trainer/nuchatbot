const mongoose = require('mongoose')
Schema = mongoose.Schema;

// create Parent Schema & Model
const ParentSchema = new Schema({
  name: {
    type: String,
    required: [true, 'name field is required']
  }, 
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    index: true,
    required: [true, 'userId field is required']
  }
},{timestamps: true});

const Parent = mongoose.model('parent', ParentSchema);
module.exports = Parent;
