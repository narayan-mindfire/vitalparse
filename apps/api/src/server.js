require('dotenv').config();
const app = require('./app');
const migrate = require('./db/migrate');
const { pool } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Check DB connection
    await pool.query('SELECT 1');
    console.log('Successfully connected to the database.');

    // Run migrations
    await migrate();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
