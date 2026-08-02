import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildCertificateHtml = ({ studentName, courseName, completionDate }) => `
  <div style="width:1122px;height:794px;background:#ffffff;display:flex;font-family:Georgia, serif;position:relative;border:1px solid #e0e0e0;">

    <div style="width:80%;padding:60px 70px;display:flex;flex-direction:column;justify-content:space-between;">
      <div>
        <div style="font-size:42px;font-weight:bold;color:#1a3a5c;font-family:Georgia, serif;letter-spacing:2px;">Legacy Wealth</div>
        <div style="border-top:2px solid #C9A84C;width:80px;margin:8px 0 24px;"></div>

        <div style="font-size:14px;color:#888;font-family:Arial, sans-serif;margin-bottom:20px;">${escapeHtml(completionDate)}</div>

        <div style="font-size:52px;color:#1a1a1a;font-weight:normal;letter-spacing:2px;margin-bottom:10px;font-family:'Playfair Display', Georgia, serif;">${escapeHtml(studentName)}</div>

        <div style="font-size:16px;color:#555;font-family:Arial, sans-serif;margin-bottom:8px;">has successfully completed</div>

        <div style="font-size:26px;font-weight:bold;color:#1a3a5c;margin-bottom:8px;">${escapeHtml(courseName)}</div>

        <div style="font-size:13px;color:#888;font-family:Arial, sans-serif;">A professional trading &amp; investing programme by Legacy Wealth Institute</div>
      </div>

      <div style="margin-top:auto;">
        <div style="border-top:1.5px solid #C9A84C;width:100px;margin-bottom:4px;"></div>
        <div style="font-size:22px;font-style:italic;color:#1a1a1a;font-family:Georgia, serif;">Akshat</div>
        <div style="font-size:13px;color:#555;font-family:Arial, sans-serif;">Founder &amp; Lead Mentor</div>
        <div style="font-size:13px;color:#555;font-family:Arial, sans-serif;">Legacy Wealth Institute</div>
      </div>
    </div>

    <div style="width:20%;background:linear-gradient(180deg, #1a3a5c 0%, #0D1B2A 100%);display:flex;flex-direction:column;align-items:center;padding:40px 20px;gap:20px;position:relative;">
      <div style="font-size:13px;font-weight:bold;letter-spacing:4px;color:rgba(255,255,255,0.7);font-family:Arial, sans-serif;text-align:center;">
        COURSE
        <div style="border-top:1px solid rgba(201,168,76,0.5);width:30px;margin:6px auto;"></div>
        CERTIFICATE
      </div>

      <div style="position:relative;margin-top:auto;margin-bottom:auto;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:150px;height:150px;border-radius:50%;border:1px dashed rgba(201,168,76,0.4);"></div>
        <div style="width:130px;height:130px;border-radius:50%;border:3px solid #C9A84C;display:flex;align-items:center;justify-content:center;flex-direction:column;background:rgba(201,168,76,0.08);">
          <div style="font-size:32px;font-weight:bold;color:#C9A84C;font-family:Georgia, serif;">LW</div>
          <div style="font-size:9px;color:rgba(255,255,255,0.6);letter-spacing:2px;text-align:center;margin-top:4px;line-height:1.4;">LEGACY WEALTH<br/>INSTITUTE</div>
        </div>
      </div>

      <div style="font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:1px;font-family:Arial, sans-serif;text-align:center;">legacywealth.info</div>
    </div>

  </div>
`;

export const generateCertificate = async ({ studentName, courseName, completionDate }) => {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.top = '0';
  wrapper.style.left = '-10000px';
  wrapper.style.zIndex = '-1';
  wrapper.innerHTML = buildCertificateHtml({ studentName, courseName, completionDate });
  document.body.appendChild(wrapper);

  try {
    const target = wrapper.firstElementChild;
    const canvas = await html2canvas(target, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
    doc.save(`Certificate_${studentName.replace(/\s/g, '_')}.pdf`);
  } finally {
    document.body.removeChild(wrapper);
  }
};

export default generateCertificate;
