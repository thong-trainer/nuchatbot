const mongoose = require('mongoose')
Schema = mongoose.Schema;

// create Feedback Schema & Model
const FeedbackSchema = new Schema({
  description: {
    type: String,
    required: [true, 'description field is required']
  },    
  active: {
    type: Boolean,
    default: false
  }
},{timestamps: true});

const Feedback = mongoose.model('feedback', FeedbackSchema);
module.exports = Feedback;
