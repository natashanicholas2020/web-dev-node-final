// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ===== Schemas =====
const islanderSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  age: Number,
  astrology_sign: String,
  hometown: String,
  episode_entered: Number,
  episode_left: Number,
  image: String,
}, { collection: 'Islanders' });

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
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

// Updated postSchema to include replies array
const postSchema = new mongoose.Schema({
  username: { type: String, required: true },
  name: String,
  message: String,
  datetime: { type: Date, default: Date.now },
  replies: [
    {
      username: String,
      message: String,
      datetime: { type: Date, default: Date.now }
    }
  ]
}, { collection: 'Posts' });

const Islander = mongoose.model('Islander', islanderSchema);
const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);

// ===== Middleware to authenticate token =====
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).send('Access denied');

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send('Invalid token');
    req.user = user;
    next();
  });
}

// ===== Routes =====

// Login (returns JWT)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || user.password !== password) {
      return res.status(401).send('Invalid username or password');
    }

    const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('Server error');
  }
});

// Get profile (requires auth)
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username }).select('-password');
    if (!user) return res.status(404).send('User not found');
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).send('Server error');
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  const username = req.user.username;  // use username from JWT payload
  const { firstName, lastName, email, dob } = req.body;

  try {
    const updatedUser = await User.findOneAndUpdate(
      { username },
      { firstName, lastName, email, dob },
      { new: true, select: '-password' }  // return updated user without password
    );

    if (!updatedUser) {
      return res.status(404).send('User not found');
    }

    res.json(updatedUser);
  } catch (e) {
    console.error('Failed to update profile:', e);
    res.status(500).send('Failed to update profile');
  }
});

// Signup endpoint
app.post('/api/signup', async (req, res) => {
  const { username, password, firstName, lastName, email, dob, role } = req.body;

  if (!username || !password || !firstName || !lastName || !email || !dob || !role) {
    return res.status(400).send('All fields are required');
  }

  try {
    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).send('Username already exists');
    }

    // Create new user document
    const newUser = new User({
      username,
      password,  // Note: In production, hash the password before saving!
      firstName,
      lastName,
      email,
      dob,
      role,
      loginId: "",       // You can customize or remove this if not needed on signup
      section: "",
      lastActivity: "",
      totalActivity: ""
    });

    await newUser.save();

    res.status(201).send('User created successfully');
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).send('Server error');
  }
});



// Get all posts (public)
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ datetime: -1 });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).send('Server error');
  }
});

// Get a single post by ID (public)
app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post not found');
    res.json(post);
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    res.status(500).send('Server error');
  }
});

// Create a post (auth required)
app.post('/api/posts', authenticateToken, async (req, res) => {
  const { name, message } = req.body;
  if (!name || !message) return res.status(400).send('Name and message are required');

  try {
    const newPost = new Post({
      username: req.user.username,
      name,
      message
    });
    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).send('Server error');
  }
});

// Add a reply to a post (auth required)
app.post('/api/posts/:id/replies', authenticateToken, async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).send('Reply message is required');
  }

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post not found');

    const reply = {
      username: req.user.username,
      message,
      datetime: new Date()
    };

    post.replies.push(reply);
    await post.save();

    res.status(201).json(reply);
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).send('Server error');
  }
});

// Get all islanders (public)
app.get('/api/islanders', async (req, res) => {
  try {
    const islanders = await Islander.find();
    res.json(islanders);
  } catch (error) {
    console.error('Error fetching islanders:', error);
    res.status(500).send('Server error');
  }
});

// Get islander by ID (public)
app.get('/api/islanders/:id', async (req, res) => {
  try {
    const islander = await Islander.findById(req.params.id);
    if (!islander) return res.status(404).send('Islander not found');
    res.json(islander);
  } catch (error) {
    console.error('Error fetching islander by ID:', error);
    res.status(500).send('Server error');
  }
});

// Add this in your server.js after other routes

app.get('/api/users/search', authenticateToken, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  try {
    const regex = new RegExp(q, 'i'); // case-insensitive search
    const users = await User.find({
      $or: [
        { username: regex },
        { firstName: regex },
        { lastName: regex },
        { email: regex },
      ],
    })
    .select('-password')
    .limit(20);
    res.json(users);
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});


// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
