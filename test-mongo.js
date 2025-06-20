require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
console.log('Trying to connect to:', MONGO_URI);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err);
  });
