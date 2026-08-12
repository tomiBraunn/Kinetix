// Mailer de Kinetix — solo para el mail de bienvenida cuando alguien se
// registra con Google. Los mails de verificación/reset de la cuenta con
// password los manda Supabase Auth solo (Custom SMTP + email-templates/),
// pero "bienvenida" no es una plantilla de Auth que Supabase soporte, así que
// esto va por afuera con nodemailer, usando la misma cuenta de Gmail.
// Configuración: GMAIL_USER + GMAIL_APP_PASSWORD en el .env (raíz del repo).

const nodemailer = require('nodemailer');

const user = process.env.GMAIL_USER;
const appPassword = process.env.GMAIL_APP_PASSWORD;

const configured = Boolean(user && appPassword);

const transporter = configured
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass: appPassword },
    })
  : null;

const BRAND = {
  primary: '#2B319C',
  accent: '#E040A0',
  background: '#F1F5F9',
  text: '#4B4B6B',
};

function layout(innerHtml) {
  return `
  <div style="background:${BRAND.background};padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 12px 32px -16px rgba(43,49,156,0.25);">
      <div style="background:${BRAND.primary};padding:24px 28px;">
        <h1 style="margin:0;color:#ffffff;font-size:20px;letter-spacing:-0.3px;">Kinetix</h1>
      </div>
      <div style="padding:28px;">${innerHtml}</div>
    </div>
  </div>`;
}

async function sendWelcomeEmail(to, nombre) {
  if (!transporter) {
    console.warn(`[mailer] no configurado (falta GMAIL_USER / GMAIL_APP_PASSWORD). No se envió bienvenida a ${to}.`);
    return false;
  }
  await transporter.sendMail({
    from: `"Kinetix" <${user}>`,
    to,
    subject: '¡Bienvenido a Kinetix!',
    html: layout(
      `<h2 style="margin:0 0 12px;color:${BRAND.primary};font-size:18px;">Hola, ${nombre}!</h2>
       <p style="font-size:15px;line-height:1.6;color:${BRAND.text};margin:0;">
         Creaste tu cuenta de Kinetix con Google. Ya podés empezar a usarla.
       </p>`
    ),
  });
  return true;
}

module.exports = { configured, sendWelcomeEmail };
