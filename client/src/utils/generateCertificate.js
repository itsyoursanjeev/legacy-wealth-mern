import { jsPDF } from 'jspdf';

const NAVY = '#0D1B2A';
const GOLD = '#C9A84C';
const WHITE = '#FFFFFF';

const letterSpaced = (str) => str.split('').join(' ');

export const generateCertificate = ({ studentName, courseName, completionDate }) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;

  // Background
  doc.setFillColor(NAVY);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Gold border, inset 10mm
  doc.setDrawColor(GOLD);
  doc.setLineWidth(0.8);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Top center: brand name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(GOLD);
  doc.text(letterSpaced('LEGACYWEALTH NATION'), centerX, 28, { align: 'center' });

  // Gold horizontal line below brand name
  doc.setDrawColor(GOLD);
  doc.setLineWidth(0.4);
  doc.line(60, 34, pageWidth - 60, 34);

  // Certificate of Completion
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(36);
  doc.setTextColor(WHITE);
  doc.text('Certificate of Completion', centerX, 62, { align: 'center' });

  // Diamond separator
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(GOLD);
  doc.text('◆', centerX, 72, { align: 'center' });

  // This certifies that
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(GOLD);
  doc.text('This certifies that', centerX, 84, { align: 'center' });

  // Student name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(WHITE);
  doc.text(studentName, centerX, 100, { align: 'center' });

  // has successfully completed
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(WHITE);
  doc.text('has successfully completed', centerX, 112, { align: 'center' });

  // Diamond separator
  doc.setFontSize(10);
  doc.setTextColor(GOLD);
  doc.text('◆', centerX, 120, { align: 'center' });

  // Course name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(GOLD);
  doc.text(courseName, centerX, 133, { align: 'center' });

  // Completion date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(WHITE);
  doc.text(completionDate, centerX, 145, { align: 'center' });

  // Bottom left: signature
  const sigX = 45;
  const sigY = 178;
  doc.setDrawColor(GOLD);
  doc.setLineWidth(0.3);
  doc.line(sigX - 20, sigY - 6, sigX + 20, sigY - 6);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(16);
  doc.setTextColor(WHITE);
  doc.text('Akshat', sigX, sigY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(GOLD);
  doc.text('Founder, LegacyWealth Nation', sigX, sigY + 6, { align: 'center' });

  // Bottom right: brand footer
  const footX = pageWidth - 45;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(GOLD);
  doc.text('LegacyWealth Nation', footX, sigY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(WHITE);
  doc.text('legacywealth.info', footX, sigY + 6, { align: 'center' });

  doc.save(`LegacyWealth_Certificate_${courseName.replace(/\s/g, '_')}.pdf`);
};

export default generateCertificate;
