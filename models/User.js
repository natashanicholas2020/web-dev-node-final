// user.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  firstName: String,
  lastName: String,
  email: String,
  dob: String,
  role: String,
  loginId: String,
  section: String,
  lastActivity: String,
  totalActivity: String,
}, { collection: 'Users' });

export default mongoose.model('User', userSchema);
