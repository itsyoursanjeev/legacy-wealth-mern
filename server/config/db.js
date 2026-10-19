const mongoose = require('mongoose');
const { assertSafeTestConfig } = require('../utils/dbSafety');

const connectDB = async () => {
  try {
    assertSafeTestConfig(process.env.MONGO_URI);
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
