const mongoose = require('mongoose')
Schema = mongoose.Schema;

// create Contact Schema & Model
const ContactSchema = new Schema({
  name: {
    type: String,
    required: [true, 'name field is required']
  }, 
  email: {
    type: String,
	  lowercase: true,
    match: [/\S+@\S+\.\S+/, 'is invalid'],
    required: [true, 'email field is required']
  },
  description: {
    type: String,
    required: [true, 'description field is required']
  },
  isCheck: {
    type: Boolean,
    default: false
  }
},{timestamps: true});

const Contact = mongoose.model('contact', ContactSchema);
module.exports = Contact;
