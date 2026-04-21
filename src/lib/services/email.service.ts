// src/lib/services/email.service.ts
// EmailService — MVP: console logging, Production: Resend
// Requisitos: 11.3, 11.4, 18.4, 22.7

// ─── Types ───────────────────────────────────────────────────

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface OrderConfirmationData {
  orderNumber: number;
  restaurantName: string;
  items: Array<{
    name: string;
    quantity: number;
    priceEur: number;
  }>;
  subtotalEur: number;
  deliveryFeeEur: number;
  totalEur: number;
  eta: string;
  deliveryAddress: string;
  fulfillmentType: 'ASAP' | 'SCHEDULED';
}

// ─── Constants ───────────────────────────────────────────────

const FROM_EMAIL = process.env.EMAIL_FROM ?? 'Pueblo Delivery <noreply@pueblodelivery.es>';
const APP_URL = process.env.APP_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

// ─── Core Send Function ──────────────────────────────────────

/**
 * Sends an email. MVP implementation logs to console.
 * In production, swap to Resend or another provider.
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_your-resend-api-key') {
    // Production: use Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[EmailService] Failed to send email via Resend:', error);
      throw new Error(`Failed to send email: ${response.status}`);
    }

    return;
  }

  // MVP: Log to console
  console.log('─────────────────────────────────────────');
  console.log('[EmailService] Email sent (MVP - console)');
  console.log(`  To: ${options.to}`);
  console.log(`  Subject: ${options.subject}`);
  console.log(`  Body: ${options.html.substring(0, 200)}...`);
  console.log('─────────────────────────────────────────');
}

// ─── Email Templates ─────────────────────────────────────────

/**
 * Sends a verification email to a newly registered user.
 * Requisito 11.3
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
): Promise<void> {
  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  await sendEmail({
    to: email,
    subject: 'Verifica tu cuenta — Pueblo Delivery',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">¡Bienvenido a Pueblo Delivery!</h1>
        <p>Gracias por registrarte. Para activar tu cuenta, haz clic en el siguiente enlace:</p>
        <p style="margin: 24px 0;">
          <a href="${verifyUrl}" 
             style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verificar mi cuenta
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Si no has creado una cuenta en Pueblo Delivery, puedes ignorar este email.
        </p>
      </div>
    `,
  });
}

/**
 * Sends a password reset email with a time-limited link (1 hour).
 * Requisito 11.4
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<void> {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${encodeURIComponent(token)}`;

  await sendEmail({
    to: email,
    subject: 'Restablecer contraseña — Pueblo Delivery',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Restablecer contraseña</h1>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Restablecer contraseña
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Este enlace es válido durante 1 hora. Si no has solicitado este cambio, puedes ignorar este email.
        </p>
      </div>
    `,
  });
}

/**
 * Sends an order confirmation email with full summary and Info_Precontractual.
 * Requisito 18.4
 */
export async function sendOrderConfirmationEmail(
  email: string,
  orderDetails: OrderConfirmationData,
): Promise<void> {
  const itemsHtml = orderDetails.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${(item.priceEur * item.quantity).toFixed(2)} €</td>
        </tr>`,
    )
    .join('');

  const fulfillmentLabel =
    orderDetails.fulfillmentType === 'ASAP'
      ? 'Lo antes posible'
      : 'Programado';

  await sendEmail({
    to: email,
    subject: `Pedido #${orderDetails.orderNumber} confirmado — Pueblo Delivery`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">✅ ¡Pedido confirmado!</h1>
        <p>Tu pedido <strong>#${orderDetails.orderNumber}</strong> de <strong>${orderDetails.restaurantName}</strong> ha sido registrado.</p>
        
        <h2 style="margin-top: 24px;">Resumen del pedido</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="padding: 8px; text-align: left;">Producto</th>
              <th style="padding: 8px; text-align: center;">Cant.</th>
              <th style="padding: 8px; text-align: right;">Precio</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="margin-top: 16px; padding: 16px; background-color: #f9fafb; border-radius: 8px;">
          <p style="margin: 4px 0;">Subtotal: <strong>${orderDetails.subtotalEur.toFixed(2)} €</strong></p>
          <p style="margin: 4px 0;">Envío: <strong>${orderDetails.deliveryFeeEur.toFixed(2)} €</strong></p>
          <p style="margin: 4px 0; font-size: 18px;">Total: <strong>${orderDetails.totalEur.toFixed(2)} €</strong></p>
        </div>
        
        <div style="margin-top: 16px;">
          <p><strong>Tipo de entrega:</strong> ${fulfillmentLabel}</p>
          <p><strong>ETA:</strong> ${orderDetails.eta}</p>
          <p><strong>Dirección:</strong> ${orderDetails.deliveryAddress}</p>
          <p><strong>Forma de pago:</strong> Contra entrega (efectivo)</p>
        </div>
        
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
        
        <div style="font-size: 12px; color: #666;">
          <p><strong>Info Precontractual:</strong></p>
          <p>Restaurante: ${orderDetails.restaurantName}</p>
          <p>Precio total desglosado: Subtotal ${orderDetails.subtotalEur.toFixed(2)} € + Envío ${orderDetails.deliveryFeeEur.toFixed(2)} € = Total ${orderDetails.totalEur.toFixed(2)} €</p>
          <p>Forma de pago: Contra entrega (efectivo)</p>
          <p>Plazo de entrega estimado: ${orderDetails.eta}</p>
          <p>Condiciones de cancelación: Los pedidos ASAP solo pueden cancelarse en estado "Pendiente". Los pedidos programados pueden cancelarse hasta 60 minutos antes de la hora de entrega.</p>
        </div>
        
        <p style="margin-top: 24px;">
          <a href="${APP_URL}/pedidos" 
             style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Ver seguimiento
          </a>
        </p>
      </div>
    `,
  });
}
