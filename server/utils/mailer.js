const nodemailer = require('nodemailer');

const createTransport = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

const wrap = (title, body) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4}
.w{max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08)}
.hd{background:#0D1B2A;padding:28px 36px}
.logo{font-size:20px;font-weight:700;color:#C9A84C;letter-spacing:1px}
.logo span{color:#fff;display:block;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin-top:3px}
.bd{padding:36px;color:#333}
h2{color:#0D1B2A;margin-top:0;font-size:20px}
.hl{background:#FDF8EE;border-left:4px solid #C9A84C;padding:16px 20px;border-radius:6px;margin:20px 0}
.hl .amt{font-size:26px;font-weight:700;color:#C9A84C}
.ft{background:#0D1B2A;padding:18px 36px;text-align:center;color:rgba(255,255,255,.4);font-size:11px}
.btn{display:inline-block;background:#C9A84C;color:#0D1B2A;padding:11px 26px;border-radius:6px;text-decoration:none;font-weight:700;margin-top:18px}
table.dt{width:100%;border-collapse:collapse;margin:14px 0}
table.dt th{background:#0D1B2A;color:#C9A84C;padding:9px 13px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px}
table.dt td{padding:9px 13px;border-bottom:1px solid #eee;font-size:13px}
</style></head><body>
<div class="w">
<div class="hd"><div class="logo">Legacy Wealth<span>Institute</span></div></div>
<div class="bd"><h2>${title}</h2>${body}</div>
<div class="ft">Legacy Wealth Institute &middot; Ludhiana, Punjab &middot; legacywealth.info<br>This is a system-generated email. Do not reply.</div>
</div></body></html>`;

const send = async ({ to, subject, html }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return;
  try {
    await createTransport().sendMail({
      from: `"Legacy Wealth Institute" <${process.env.FROM_EMAIL || 'noreply@legacywealth.info'}>`,
      to, subject, html
    });
  } catch (err) {
    console.error('[Mailer]', err.message);
  }
};

const sendReturnCredited = ({ to, name, month, amount, currentValue }) =>
  send({
    to, subject: `Return Credited for ${month} — Legacy Wealth`,
    html: wrap(`₹${amount.toLocaleString('en-IN')} credited for ${month}`, `
      <p>Dear ${name},</p>
      <p>Your monthly return for <strong>${month}</strong> has been credited.</p>
      <div class="hl"><div>Monthly Return</div><div class="amt">₹${Number(amount).toLocaleString('en-IN')}</div>
      <div style="margin-top:8px;color:#666">Current Value: <strong>₹${Math.round(currentValue).toLocaleString('en-IN')}</strong></div></div>
      <a href="${process.env.CLIENT_URL}/dashboard" class="btn">View Dashboard</a>`)
  });

const sendWithdrawalProcessed = ({ to, name, amount, status, adminNote }) =>
  send({
    to, subject: `Withdrawal ${status === 'approved' ? 'Approved' : 'Rejected'} — Legacy Wealth`,
    html: wrap(`Withdrawal request ${status}`, `
      <p>Dear ${name},</p>
      <p>Your withdrawal of <strong>₹${Number(amount).toLocaleString('en-IN')}</strong> has been <strong>${status}</strong>.</p>
      ${adminNote ? `<div class="hl"><strong>Note:</strong> ${adminNote}</div>` : ''}
      ${status === 'approved' ? '<p>Amount will be processed to your account within 3–5 business days.</p>' : '<p>Please contact us if you have questions.</p>'}
      <a href="${process.env.CLIENT_URL}/dashboard" class="btn">View Dashboard</a>`)
  });

const sendInvestmentActivated = ({ to, name, principal, monthlyRate, startDate }) =>
  send({
    to, subject: 'Your Investment is Now Active — Legacy Wealth',
    html: wrap('Welcome to Legacy Wealth Investment', `
      <p>Dear ${name},</p><p>Your investment has been activated.</p>
      <table class="dt"><tr><th>Field</th><th>Value</th></tr>
      <tr><td>Principal</td><td>₹${Number(principal).toLocaleString('en-IN')}</td></tr>
      <tr><td>Monthly Return Rate</td><td>${monthlyRate}%</td></tr>
      <tr><td>Start Date</td><td>${new Date(startDate).toLocaleDateString('en-IN')}</td></tr></table>
      <p>Returns are credited each month. You'll receive an email when your return is credited.</p>
      <a href="${process.env.CLIENT_URL}/dashboard" class="btn">View Dashboard</a>`)
  });

const sendMilestoneReached = ({ to, name, growthPercent, currentValue }) =>
  send({
    to, subject: `${Math.round(growthPercent)}% Growth Milestone — Legacy Wealth`,
    html: wrap(`You've crossed ${Math.round(growthPercent)}% growth!`, `
      <p>Dear ${name},</p>
      <p>Your portfolio has crossed the <strong>${Math.round(growthPercent)}%</strong> growth milestone.</p>
      <div class="hl"><div>Current Value</div><div class="amt">₹${Math.round(currentValue).toLocaleString('en-IN')}</div></div>
      <p>Keep compounding — wealth is built over time.</p>
      <a href="${process.env.CLIENT_URL}/dashboard" class="btn">View Portfolio</a>`)
  });

module.exports = { sendReturnCredited, sendWithdrawalProcessed, sendInvestmentActivated, sendMilestoneReached };
