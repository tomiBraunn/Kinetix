const express = require('express');
const app = express();
const authRoutes = require('./routes/index');


app.use(express.json());


app.get('/health', (req, res) => {
    res.json({ status: "ok" });
});


app.use('/api/auth', authRoutes);

module.exports = app;