import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendEmail, sendVerificationEmail, sendPasswordResetEmail, sendOrderConfirmationEmail } from '../email.service';
import type { OrderConfirmationData } from '../email.service';

describe('EmailService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Ensure MVP mode (no Resend API key)
    delete process.env.RESEND_API_KEY;
  });

  describe('sendEmail (MVP console mode)', () => {
    it('logs email to console in MVP mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test body</p>',
      });

      expect(consoleSpy).toHaveBeenCalled();
      const allCalls = consoleSpy.mock.calls.flat().join(' ');
      expect(allCalls).toContain('test@example.com');
      expect(allCalls).toContain('Test Subject');
    });
  });

  describe('sendVerificationEmail', () => {
    it('sends email with verification link', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await sendVerificationEmail('user@example.com', 'abc123');

      const allCalls = consoleSpy.mock.calls.flat().join(' ');
      expect(allCalls).toContain('user@example.com');
      expect(allCalls).toContain('Verifica tu cuenta');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('sends email with reset link', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await sendPasswordResetEmail('user@example.com', 'reset-token-xyz');

      const allCalls = consoleSpy.mock.calls.flat().join(' ');
      expect(allCalls).toContain('user@example.com');
      expect(allCalls).toContain('Restablecer contraseña');
    });
  });

  describe('sendOrderConfirmationEmail', () => {
    it('sends email with order details', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const orderDetails: OrderConfirmationData = {
        orderNumber: 42,
        restaurantName: 'Casa Tradición',
        items: [
          { name: 'Paella Mixta', quantity: 1, priceEur: 12.0 },
          { name: 'Ensalada', quantity: 2, priceEur: 6.5 },
        ],
        subtotalEur: 25.0,
        deliveryFeeEur: 2.0,
        totalEur: 27.0,
        eta: '13:30–13:40',
        deliveryAddress: 'Calle Mayor 5, Sevilla',
        fulfillmentType: 'SCHEDULED',
      };

      await sendOrderConfirmationEmail('customer@example.com', orderDetails);

      const allCalls = consoleSpy.mock.calls.flat().join(' ');
      expect(allCalls).toContain('customer@example.com');
      expect(allCalls).toContain('Pedido #42 confirmado');
    });
  });
});
