const mongoose = require('mongoose');
require('dotenv').config();

const connectionString = process.env.MONGO_URI;
mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });