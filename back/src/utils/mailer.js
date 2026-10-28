// Mailer de Kinetix — solo para el mail de bienvenida cuando alguien se
// registra con Google. Los mails de verificación/reset de la cuenta con
// password los manda Supabase Auth solo (Custom SMTP + email-templates/),
// pero "bienvenida" no es una plantilla de Auth que Supabase soporte, así que
// esto va por afuera con nodemailer.
//
// Salida en dos pasos: primero intenta con el mail del dominio propio
// (MAIL_DOMINIO_*), y si falla —por ejemplo porque el dominio se venció,
// que se paga por año— sale por la cuenta de Gmail de siempre.
// Configuración (.env de la raíz del repo):
//   Gmail (respaldo): GMAIL_USER + GMAIL_APP_PASSWORD
//   Dominio (opcional): MAIL_DOMINIO_HOST, MAIL_DOMINIO_PORT, MAIL_DOMINIO_USER, MAIL_DOMINIO_PASS

const nodemailer = require('nodemailer');

const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_APP_PASSWORD;
const dominioHost = process.env.MAIL_DOMINIO_HOST;
const dominioPort = Number(process.env.MAIL_DOMINIO_PORT || 465);
const dominioUser = process.env.MAIL_DOMINIO_USER;
const dominioPass = process.env.MAIL_DOMINIO_PASS;

const gmailListo = Boolean(gmailUser && gmailPass);
const dominioListo = Boolean(dominioHost && dominioUser && dominioPass);
const configured = gmailListo || dominioListo;

// Cada salida: { nombre, from, transporter }. El orden es el de preferencia.
const salidas = [
  dominioListo && {
    nombre: 'dominio',
    from: dominioUser,
    transporter: nodemailer.createTransport({
      host: dominioHost,
      port: dominioPort,
      secure: dominioPort === 465,
      auth: { user: dominioUser, pass: dominioPass },
      connectionTimeout: 8000,
    }),
  },
  gmailListo && {
    nombre: 'gmail',
    from: gmailUser,
    transporter: nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    }),
  },
].filter(Boolean);

// Prueba cada salida en orden y se queda con la primera que funciona
async function enviar({ to, subject, html }) {
  let ultimoError = null;
  for (const salida of salidas) {
    try {
      await salida.transporter.sendMail({ from: `"Kinetix" <${salida.from}>`, to, subject, html });
      return true;
    } catch (err) {
      ultimoError = err;
      console.warn(`[mailer] falló la salida "${salida.nombre}" (${err.message}); se prueba la siguiente.`);
    }
  }
  if (ultimoError) throw ultimoError;
  return false;
}

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
  if (salidas.length === 0) {
    console.warn(`[mailer] no configurado (falta GMAIL_USER / GMAIL_APP_PASSWORD o MAIL_DOMINIO_*). No se envió bienvenida a ${to}.`);
    return false;
  }
  return enviar({
    to,
    subject: '¡Bienvenido a Kinetix!',
    html: layout(
      `<h2 style="margin:0 0 12px;color:${BRAND.primary};font-size:18px;">Hola, ${nombre}!</h2>
       <p style="font-size:15px;line-height:1.6;color:${BRAND.text};margin:0;">
         Creaste tu cuenta de Kinetix con Google. Ya podés empezar a usarla.
       </p>`
    ),
  });
}

module.exports = { configured, sendWelcomeEmail };
