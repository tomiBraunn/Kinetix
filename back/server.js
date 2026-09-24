require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const app = require('./src/app');

// En Vercel este archivo se importa como función serverless (Vercel llama
// al app exportado por request, nunca corre `node server.js`) — listen()
// solo hace falta para desarrollo local.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;