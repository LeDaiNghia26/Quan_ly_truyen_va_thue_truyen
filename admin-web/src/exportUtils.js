import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

let fontB64 = null;

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function useUnicodeFont(doc) {
  try {
    if (!fontB64) {
      const buf = await fetch('/fonts/arial.ttf').then((r) => r.arrayBuffer());
      fontB64 = arrayBufferToBase64(buf);
    }
    doc.addFileToVFS('Arial.ttf', fontB64);
    doc.addFont('Arial.ttf', 'Arial', 'normal');
    doc.setFont('Arial');
  } catch (e) {
    /* dùng font mặc định nếu không tải được */
  }
}

export function exportExcel(sheets, filename) {
  const wb = XLSX.utils.book_new();
  for (const { name, rows } of sheets) {
    const ws = XLSX.utils.json_to_sheet(rows && rows.length ? rows : [{ '': '' }]);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  }
  XLSX.writeFile(wb, filename);
}

export async function exportPdf({ title, sections }, filename) {
  const doc = new jsPDF();
  await useUnicodeFont(doc);
  let y = 16;
  doc.setFontSize(14);
  doc.text(title, 14, y);
  y += 4;
  for (const sec of sections) {
    if (sec.name) {
      doc.setFontSize(11);
      doc.text(sec.name, 14, y + 6);
      y += 8;
    }
    autoTable(doc, {
      startY: y,
      head: [sec.head],
      body: sec.body,
      theme: 'grid',
      styles: { font: 'Arial', fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] },
      didParseCell: (data) => {
        if (data.section === 'body') data.cell.styles.font = 'Arial';
      },
    });
    y = (doc.lastAutoTable?.finalY || y) + 10;
  }
  doc.save(filename);
}
