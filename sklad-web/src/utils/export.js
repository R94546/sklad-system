import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToExcel = (data, columns, filename = 'export') => {
  const rows = data.map(row =>
    columns.reduce((acc, col) => {
      acc[col.title] = col.getValue ? col.getValue(row) : row[col.key];
      return acc;
    }, {})
  );
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, filename + '.xlsx');
};

export const exportToPDF = (data, columns, title = 'Hisobot', filename = 'export') => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString(), 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [columns.map(c => c.title)],
    body: data.map(row => columns.map(col => col.getValue ? col.getValue(row) : row[col.key] || '-')),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(filename + '.pdf');
};
