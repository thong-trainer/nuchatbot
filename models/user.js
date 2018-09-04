const mongoose = require('mongoose')
Schema = mongoose.Schema;

// create User Schema & Model
const UserSchema = new Schema({
  name: {
    type: String,
    required: [true, 'name field is required']
  },    
  active: {
    type: Boolean,
    default: true
  }
},{timestamps: true});

const User = mongoose.model('user', UserSchema);
module.exports = User;
