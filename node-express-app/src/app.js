const express = require('express');
const app = express();
const authRoutes = require('./routes/index');

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: "ok" });
});

// Routes
app.use('/api/auth', authRoutes);

module.exports = app;