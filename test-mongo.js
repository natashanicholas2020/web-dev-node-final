// require('dotenv').config();
// const mongoose = require('mongoose');

// const MONGO_URI = process.env.MONGO_URI;
// console.log('Trying to connect to:', MONGO_URI);

// mongoose.connect(MONGO_URI)
//   .then(() => {
//     console.log('✅ MongoDB connected successfully');
//     mongoose.connection.close();
//   })
//   .catch(err => {
//     console.error('❌ MongoDB connection failed:', err);
//   });



require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
console.log('Trying to connect to:', MONGO_URI);

mongoose.connection.on('connecting', () => console.log('Connecting to MongoDB...'));
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
  mongoose.connection.close();
});
mongoose.connection.on('error', (err) => console.error('❌ MongoDB connection error:', err));
mongoose.connection.on('disconnected', () => console.log('Disconnected from MongoDB'));

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
});
