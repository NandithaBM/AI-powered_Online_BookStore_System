const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

class InvoiceService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Generate PDF invoice
  async generateInvoice(order) {
    try {
      const html = this.generateInvoiceHTML(order);
      
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });
      
      await browser.close();
      
      // Save invoice to file system
      const invoiceDir = path.join(__dirname, '../invoices');
      if (!fs.existsSync(invoiceDir)) {
        fs.mkdirSync(invoiceDir, { recursive: true });
      }
      
      const filename = `invoice-${order._id}-${Date.now()}.pdf`;
      const filepath = path.join(invoiceDir, filename);
      
      fs.writeFileSync(filepath, pdfBuffer);
      
      return {
        filename,
        filepath,
        buffer: pdfBuffer
      };
      
    } catch (error) {
      console.error('Invoice generation error:', error);
      throw new Error('Failed to generate invoice');
    }
  }

  // Generate HTML template for invoice
  generateInvoiceHTML(order) {
    const invoiceDate = new Date().toLocaleDateString();
    const orderDate = new Date(order.createdAt).toLocaleDateString();
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice #${order._id}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #333;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #3B82F6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .company-info {
          text-align: left;
        }
        .company-name {
          font-size: 28px;
          font-weight: bold;
          color: #3B82F6;
          margin: 0;
        }
        .company-tagline {
          color: #6B7280;
          margin: 5px 0;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-title {
          font-size: 24px;
          font-weight: bold;
          margin: 0;
        }
        .invoice-number {
          color: #6B7280;
          margin: 5px 0;
        }
        .billing-section {
          display: flex;
          justify-content: space-between;
          margin: 30px 0;
        }
        .billing-info {
          width: 45%;
        }
        .billing-title {
          font-weight: bold;
          color: #374151;
          margin-bottom: 10px;
          font-size: 16px;
        }
        .address {
          color: #6B7280;
          line-height: 1.4;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
        }
        .items-table th {
          background-color: #F3F4F6;
          padding: 12px;
          text-align: left;
          font-weight: bold;
          color: #374151;
          border-bottom: 2px solid #E5E7EB;
        }
        .items-table td {
          padding: 12px;
          border-bottom: 1px solid #E5E7EB;
        }
        .items-table tr:nth-child(even) {
          background-color: #F9FAFB;
        }
        .text-right {
          text-align: right;
        }
        .totals-section {
          margin-left: auto;
          width: 300px;
          margin-top: 20px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #E5E7EB;
        }
        .total-row.final {
          font-weight: bold;
          font-size: 18px;
          border-bottom: 2px solid #3B82F6;
          color: #3B82F6;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #E5E7EB;
          text-align: center;
          color: #6B7280;
          font-size: 12px;
        }
        .payment-info {
          background-color: #F0FDF4;
          border: 1px solid #10B981;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        .payment-success {
          color: #059669;
          font-weight: bold;
          display: flex;
          align-items: center;
        }
        .status-badge {
          background-color: #10B981;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <h1 class="company-name">AI Bookstore</h1>
          <p class="company-tagline">Discover Your Next Great Read</p>
          <p>123 Book Street, Reading City, RC 12345</p>
          <p>Email: orders@aibookstore.com | Phone: (555) 123-4567</p>
        </div>
        <div class="invoice-info">
          <h2 class="invoice-title">INVOICE</h2>
          <p class="invoice-number">#${order._id.toString().slice(-8).toUpperCase()}</p>
          <p>Date: ${invoiceDate}</p>
          <span class="status-badge">PAID</span>
        </div>
      </div>

      <div class="billing-section">
        <div class="billing-info">
          <div class="billing-title">Bill To:</div>
          <div class="address">
            ${order.billingAddress?.name || 'Customer'}<br>
            ${order.billingAddress?.address || ''}<br>
            ${order.billingAddress?.city || ''}, ${order.billingAddress?.state || ''} ${order.billingAddress?.zipCode || ''}<br>
            ${order.billingAddress?.country || ''}
          </div>
        </div>
        <div class="billing-info">
          <div class="billing-title">Ship To:</div>
          <div class="address">
            ${order.shippingAddress?.name || 'Customer'}<br>
            ${order.shippingAddress?.address || ''}<br>
            ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.zipCode || ''}<br>
            ${order.shippingAddress?.country || ''}
          </div>
        </div>
      </div>

      <div class="order-details">
        <p><strong>Order Date:</strong> ${orderDate}</p>
        <p><strong>Payment Method:</strong> Credit Card</p>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Author</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td>${item.book?.title || item.title || 'Book'}</td>
              <td>${item.book?.author || 'Unknown Author'}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">$${item.price.toFixed(2)}</td>
              <td class="text-right">$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals-section">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>$${(order.totalAmount - (order.shippingCost || 0)).toFixed(2)}</span>
        </div>
        ${order.shippingCost ? `
          <div class="total-row">
            <span>Shipping:</span>
            <span>$${order.shippingCost.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="total-row">
          <span>Tax:</span>
          <span>$0.00</span>
        </div>
        <div class="total-row final">
          <span>Total:</span>
          <span>$${order.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div class="payment-info">
        <div class="payment-success">
          ✓ Payment Successful - Thank you for your order!
        </div>
        <p style="margin: 10px 0 0 0; color: #059669;">
          Payment processed on ${new Date(order.paidAt || order.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div class="footer">
        <p>Thank you for choosing AI Bookstore!</p>
        <p>This is a computer-generated invoice. No signature required.</p>
        <p>For support, contact us at support@aibookstore.com or visit our website.</p>
      </div>
    </body>
    </html>
    `;
  }

  // Send invoice via email
  async sendInvoiceEmail(userId, invoice) {
    try {
      const User = require('../models/User');
      const user = await User.findById(userId);
      
      if (!user || !user.email) {
        throw new Error('User email not found');
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@aibookstore.com',
        to: user.email,
        subject: `Your AI Bookstore Invoice - Order Confirmation`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">Thank You for Your Order!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your payment has been processed successfully</p>
            </div>
            
            <div style="padding: 30px; background: #F9FAFB;">
              <h2 style="color: #374151; margin-top: 0;">Order Confirmation</h2>
              <p style="color: #6B7280; line-height: 1.6;">
                We're excited to let you know that your order has been confirmed and your books are being prepared for shipment.
                You'll receive a shipping notification once your order is on its way.
              </p>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10B981;">
                <h3 style="color: #059669; margin-top: 0;">What's Next?</h3>
                <ul style="color: #6B7280; line-height: 1.8;">
                  <li>We'll prepare your books for shipment within 1-2 business days</li>
                  <li>You'll receive a tracking number via email once shipped</li>
                  <li>Your books will arrive within 3-7 business days</li>
                </ul>
              </div>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #374151; margin-top: 0;">Need Help?</h3>
                <p style="color: #6B7280; margin-bottom: 15px;">
                  If you have any questions about your order, feel free to contact our customer support team:
                </p>
                <p style="color: #6B7280; margin: 5px 0;">
                  📧 Email: <a href="mailto:support@aibookstore.com" style="color: #3B82F6;">support@aibookstore.com</a>
                </p>
                <p style="color: #6B7280; margin: 5px 0;">
                  📞 Phone: (555) 123-4567
                </p>
              </div>
            </div>
            
            <div style="background: #374151; color: white; padding: 20px; text-align: center;">
              <p style="margin: 0; opacity: 0.8;">Happy Reading!</p>
              <p style="margin: 5px 0 0 0; font-weight: bold;">The AI Bookstore Team</p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: invoice.filename,
            content: invoice.buffer,
            contentType: 'application/pdf'
          }
        ]
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Invoice email sent to ${user.email}`);
      
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send invoice email');
    }
  }

  // Get invoice by order ID
  async getInvoice(orderId) {
    try {
      const invoiceDir = path.join(__dirname, '../invoices');
      const files = fs.readdirSync(invoiceDir);
      
      const invoiceFile = files.find(file => file.includes(orderId));
      if (!invoiceFile) {
        throw new Error('Invoice not found');
      }
      
      const filepath = path.join(invoiceDir, invoiceFile);
      const buffer = fs.readFileSync(filepath);
      
      return {
        filename: invoiceFile,
        filepath,
        buffer
      };
      
    } catch (error) {
      console.error('Get invoice error:', error);
      throw new Error('Failed to retrieve invoice');
    }
  }
}

module.exports = new InvoiceService();