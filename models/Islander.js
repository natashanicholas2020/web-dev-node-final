import mongoose from 'mongoose';

const islanderSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  age: Number,
  astrology_sign: String,
  hometown: String,
  episode_entered: Number,
  episode_left: Number
});

export default mongoose.model('Islander', islanderSchema);
