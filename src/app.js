const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('./utils/passport');
const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', require('./routes/index'));

module.exports = app;
