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
app.use('/api/upload', require('./routes/upload'));
app.use('/api/pacientes', require('./routes/pacientes'));

module.exports = app;
