import { Invoice, InvoiceItem, Client } from '@/types';

/**
 * Generate a PDF invoice
 * 
 * Note: This implementation uses a simple HTML-based approach that can be
 * rendered to PDF. For production, consider using pdfkit or similar library.
 * 
 * To install pdfkit: npm install pdfkit @types/pdfkit
 */

interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}

interface InvoiceData {
  invoice: InvoiceWithItems;
  client: Client;
}

/**
 * Generate HTML content for invoice that can be converted to PDF
 */
export function generateInvoiceHTML(data: InvoiceData): string {
  const { invoice, client } = data;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #333;
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }
    
    .company-info {
      flex: 1;
    }
    
    .company-name {
      font-size: 24pt;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    
    .company-details {
      font-size: 10pt;
      color: #666;
      line-height: 1.6;
    }
    
    .invoice-title {
      text-align: right;
      flex: 1;
    }
    
    .invoice-title h1 {
      font-size: 32pt;
      color: #2563eb;
      margin-bottom: 10px;
    }
    
    .invoice-number {
      font-size: 12pt;
      color: #666;
    }
    
    .invoice-details {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    
    .bill-to, .invoice-info {
      flex: 1;
    }
    
    .section-title {
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 10px;
      letter-spacing: 0.5px;
    }
    
    .client-name {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .client-details {
      font-size: 10pt;
      color: #666;
      line-height: 1.6;
    }
    
    .invoice-info {
      text-align: right;
    }
    
    .info-row {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 5px;
      font-size: 10pt;
    }
    
    .info-label {
      font-weight: bold;
      margin-right: 10px;
      color: #666;
    }
    
    .info-value {
      color: #333;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 9pt;
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .status-paid {
      background-color: #d1fae5;
      color: #065f46;
    }
    
    .status-sent {
      background-color: #dbeafe;
      color: #1e40af;
    }
    
    .status-overdue {
      background-color: #fee2e2;
      color: #991b1b;
    }
    
    .status-draft {
      background-color: #f3f4f6;
      color: #374151;
    }
    
    .line-items {
      margin-bottom: 30px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    thead {
      background-color: #f3f4f6;
    }
    
    th {
      text-align: left;
      padding: 12px;
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      color: #666;
      border-bottom: 2px solid #e5e7eb;
    }
    
    th.text-right {
      text-align: right;
    }
    
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 10pt;
    }
    
    td.text-right {
      text-align: right;
    }
    
    td.text-center {
      text-align: center;
    }
    
    tbody tr:last-child td {
      border-bottom: 2px solid #e5e7eb;
    }
    
    .totals {
      margin-left: auto;
      width: 300px;
      margin-bottom: 30px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      font-size: 11pt;
    }
    
    .total-row.subtotal {
      color: #666;
    }
    
    .total-row.tax {
      color: #666;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 12px;
      margin-bottom: 8px;
    }
    
    .total-row.grand-total {
      font-size: 14pt;
      font-weight: bold;
      background-color: #f3f4f6;
      border-radius: 4px;
      color: #2563eb;
    }
    
    .notes {
      margin-top: 30px;
      padding: 20px;
      background-color: #f9fafb;
      border-left: 4px solid #2563eb;
      border-radius: 4px;
    }
    
    .notes-title {
      font-weight: bold;
      margin-bottom: 10px;
      color: #2563eb;
    }
    
    .notes-content {
      font-size: 10pt;
      color: #666;
      line-height: 1.6;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 9pt;
      color: #999;
    }
    
    .payment-info {
      margin-top: 30px;
      padding: 15px;
      background-color: #eff6ff;
      border-radius: 4px;
      border: 1px solid #bfdbfe;
    }
    
    .payment-info-title {
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 8px;
    }
    
    .payment-info-content {
      font-size: 10pt;
      color: #1e3a8a;
      line-height: 1.6;
    }
    
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .invoice-container {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <div class="company-name">Tech Support Computer Services</div>
        <div class="company-details">
          123 Tech Street<br>
          San Francisco, CA 94105<br>
          Phone: (555) 123-4567<br>
          Email: billing@techsupportcs.com<br>
          Website: www.techsupportcs.com
        </div>
      </div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <div class="invoice-number">${invoice.invoice_number}</div>
      </div>
    </div>
    
    <!-- Invoice Details -->
    <div class="invoice-details">
      <div class="bill-to">
        <div class="section-title">Bill To</div>
        <div class="client-name">${client.company_name || client.name}</div>
        <div class="client-details">
          ${client.name}<br>
          ${client.email}<br>
          ${client.phone ? `${client.phone}<br>` : ''}
          ${client.address ? client.address.replace(/\n/g, '<br>') : ''}
        </div>
      </div>
      
      <div class="invoice-info">
        <div class="section-title">Invoice Information</div>
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Issue Date:</span>
          <span class="info-value">${formatDate(invoice.issue_date)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Due Date:</span>
          <span class="info-value">${formatDate(invoice.due_date)}</span>
        </div>
        ${invoice.paid_date ? `
        <div class="info-row">
          <span class="info-label">Paid Date:</span>
          <span class="info-value">${formatDate(invoice.paid_date)}</span>
        </div>
        ` : ''}
      </div>
    </div>
    
    <!-- Line Items -->
    <div class="line-items">
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-center">Quantity</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
          <tr>
            <td>${item.description}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-right">${formatCurrency(item.unit_price, invoice.currency)}</td>
            <td class="text-right">${formatCurrency(item.amount, invoice.currency)}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <!-- Totals -->
    <div class="totals">
      <div class="total-row subtotal">
        <span>Subtotal:</span>
        <span>${formatCurrency(invoice.subtotal, invoice.currency)}</span>
      </div>
      ${invoice.tax_rate > 0 ? `
      <div class="total-row tax">
        <span>Tax (${(invoice.tax_rate * 100).toFixed(2)}%):</span>
        <span>${formatCurrency(invoice.tax_amount, invoice.currency)}</span>
      </div>
      ` : ''}
      <div class="total-row grand-total">
        <span>Total:</span>
        <span>${formatCurrency(invoice.total, invoice.currency)}</span>
      </div>
    </div>
    
    <!-- Payment Information -->
    ${invoice.status !== 'paid' ? `
    <div class="payment-info">
      <div class="payment-info-title">Payment Instructions</div>
      <div class="payment-info-content">
        Please pay online through our client portal:<br>
        <strong>https://portal.techsupportcs.com/dashboard/invoices/${invoice.id}</strong><br><br>
        We accept PayPal and all major credit cards.<br>
        Payment is due by ${formatDate(invoice.due_date)}.
      </div>
    </div>
    ` : ''}
    
    <!-- Notes -->
    ${invoice.notes ? `
    <div class="notes">
      <div class="notes-title">Notes</div>
      <div class="notes-content">${invoice.notes.replace(/\n/g, '<br>')}</div>
    </div>
    ` : ''}
    
    <!-- Footer -->
    <div class="footer">
      <p>Thank you for your business!</p>
      <p>Tech Support Computer Services | billing@techsupportcs.com | (555) 123-4567</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Convert HTML to PDF buffer
 * This is a placeholder that would use a proper PDF library in production
 */
export async function htmlToPDF(html: string): Promise<Buffer> {
  // In a real implementation, you would use a library like:
  // - puppeteer (for server-side rendering)
  // - pdfkit (for programmatic PDF generation)
  // - @react-pdf/renderer (for React-based PDFs)
  
  // For Cloudflare Workers, the best approach is to use the browser's
  // print-to-PDF functionality or a service like Browserless
  
  // This is a placeholder that returns the HTML as a buffer
  // In production, replace this with actual PDF generation
  throw new Error('PDF generation requires a PDF library. Please install pdfkit or use a PDF service.');
}

/**
 * Generate invoice PDF
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const html = generateInvoiceHTML(data);
  
  // For now, return HTML as buffer
  // In production, convert to actual PDF
  return Buffer.from(html, 'utf-8');
}

/**
 * Generate HTML content for receipt that can be converted to PDF
 */
export function generateReceiptHTML(data: {
  payment: Payment;
  invoice?: Invoice;
  client: Client;
}): string {
  const { payment, invoice, client } = data;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt ${payment.id}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #333;
    }
    
    .receipt-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #10b981;
    }
    
    .company-info {
      flex: 1;
    }
    
    .company-name {
      font-size: 24pt;
      font-weight: bold;
      color: #10b981;
      margin-bottom: 10px;
    }
    
    .company-details {
      font-size: 10pt;
      color: #666;
      line-height: 1.6;
    }
    
    .receipt-title {
      text-align: right;
      flex: 1;
    }
    
    .receipt-title h1 {
      font-size: 32pt;
      color: #10b981;
      margin-bottom: 10px;
    }
    
    .receipt-id {
      font-size: 10pt;
      color: #666;
      font-family: monospace;
    }
    
    .receipt-details {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    
    .client-info, .payment-info {
      flex: 1;
    }
    
    .section-title {
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 10px;
      letter-spacing: 0.5px;
    }
    
    .client-name {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .client-details {
      font-size: 10pt;
      color: #666;
      line-height: 1.6;
    }
    
    .payment-info {
      text-align: right;
    }
    
    .info-row {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 5px;
      font-size: 10pt;
    }
    
    .info-label {
      font-weight: bold;
      margin-right: 10px;
      color: #666;
    }
    
    .info-value {
      color: #333;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 9pt;
      font-weight: bold;
      text-transform: uppercase;
      background-color: #d1fae5;
      color: #065f46;
    }
    
    .payment-summary {
      background-color: #f0fdf4;
      border: 2px solid #10b981;
      border-radius: 8px;
      padding: 30px;
      margin-bottom: 30px;
      text-align: center;
    }
    
    .payment-summary-title {
      font-size: 12pt;
      color: #065f46;
      margin-bottom: 15px;
      font-weight: bold;
    }
    
    .payment-amount {
      font-size: 36pt;
      font-weight: bold;
      color: #10b981;
      margin-bottom: 10px;
    }
    
    .payment-date {
      font-size: 11pt;
      color: #666;
    }
    
    .transaction-details {
      background-color: #f9fafb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
    }
    
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .detail-row:last-child {
      border-bottom: none;
    }
    
    .detail-label {
      font-weight: bold;
      color: #666;
    }
    
    .detail-value {
      color: #333;
      font-family: monospace;
    }
    
    .thank-you {
      text-align: center;
      padding: 30px;
      background-color: #eff6ff;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .thank-you h2 {
      color: #1e40af;
      font-size: 18pt;
      margin-bottom: 10px;
    }
    
    .thank-you p {
      color: #1e3a8a;
      font-size: 11pt;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 9pt;
      color: #999;
    }
    
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .receipt-container {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <div class="company-name">Tech Support Computer Services</div>
        <div class="company-details">
          123 Tech Street<br>
          San Francisco, CA 94105<br>
          Phone: (555) 123-4567<br>
          Email: billing@techsupportcs.com<br>
          Website: www.techsupportcs.com
        </div>
      </div>
      <div class="receipt-title">
        <h1>RECEIPT</h1>
        <div class="receipt-id">ID: ${payment.id}</div>
      </div>
    </div>
    
    <!-- Receipt Details -->
    <div class="receipt-details">
      <div class="client-info">
        <div class="section-title">Received From</div>
        <div class="client-name">${client.company_name || client.name}</div>
        <div class="client-details">
          ${client.name}<br>
          ${client.email}<br>
          ${client.phone ? `${client.phone}<br>` : ''}
          ${client.address ? client.address.replace(/\n/g, '<br>') : ''}
        </div>
      </div>
      
      <div class="payment-info">
        <div class="section-title">Payment Information</div>
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span class="status-badge">${payment.status.toUpperCase()}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Date:</span>
          <span class="info-value">${formatDate(payment.created_at)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Method:</span>
          <span class="info-value">${payment.payment_method.toUpperCase()}</span>
        </div>
        ${invoice ? `
        <div class="info-row">
          <span class="info-label">Invoice:</span>
          <span class="info-value">${invoice.invoice_number}</span>
        </div>
        ` : ''}
      </div>
    </div>
    
    <!-- Payment Summary -->
    <div class="payment-summary">
      <div class="payment-summary-title">Amount Paid</div>
      <div class="payment-amount">${formatCurrency(payment.amount, payment.currency)}</div>
      <div class="payment-date">Paid on ${formatDate(payment.created_at)}</div>
    </div>
    
    <!-- Transaction Details -->
    <div class="transaction-details">
      <div class="detail-row">
        <span class="detail-label">Transaction ID:</span>
        <span class="detail-value">${payment.paypal_transaction_id || payment.id}</span>
      </div>
      ${payment.paypal_order_id ? `
      <div class="detail-row">
        <span class="detail-label">Order ID:</span>
        <span class="detail-value">${payment.paypal_order_id}</span>
      </div>
      ` : ''}
      <div class="detail-row">
        <span class="detail-label">Payment Method:</span>
        <span class="detail-value">${payment.payment_method.toUpperCase()}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Currency:</span>
        <span class="detail-value">${payment.currency}</span>
      </div>
      ${invoice ? `
      <div class="detail-row">
        <span class="detail-label">Invoice Number:</span>
        <span class="detail-value">${invoice.invoice_number}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Invoice Date:</span>
        <span class="detail-value">${formatDate(invoice.issue_date)}</span>
      </div>
      ` : ''}
      ${payment.subscription_id ? `
      <div class="detail-row">
        <span class="detail-label">Subscription Payment:</span>
        <span class="detail-value">Yes</span>
      </div>
      ` : ''}
    </div>
    
    <!-- Thank You Message -->
    <div class="thank-you">
      <h2>Thank You!</h2>
      <p>We appreciate your business and prompt payment.</p>
      <p>If you have any questions about this receipt, please contact us.</p>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>This is an official payment receipt from Tech Support Computer Services</p>
      <p>Tech Support Computer Services | billing@techsupportcs.com | (555) 123-4567</p>
      <p>Generated on ${formatDate(new Date().toISOString())}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate receipt PDF
 */
export async function generateReceiptPDF(data: {
  payment: Payment;
  invoice?: Invoice;
  client: Client;
}): Promise<Buffer> {
  const html = generateReceiptHTML(data);
  
  // For now, return HTML as buffer
  // In production, convert to actual PDF
  return Buffer.from(html, 'utf-8');
}
