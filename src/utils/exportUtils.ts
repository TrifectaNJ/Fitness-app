import { format } from 'date-fns';

export interface ExportData {
  userId: string;
  userName: string;
  userEmail: string;
  date: string;
  type: string;
  value: number;
  unit: string;
  target?: number;
}

export function generateCSV(data: ExportData[]): string {
  const headers = ['User Name', 'User Email', 'Date', 'Type', 'Value', 'Unit', 'Target'];
  const csvContent = [
    headers.join(','),
    ...data.map(row => [
      `"${row.userName}"`,
      `"${row.userEmail}"`,
      row.date,
      row.type,
      row.value,
      row.unit,
      row.target || ''
    ].join(','))
  ].join('\n');
  
  return csvContent;
}

export function downloadCSV(data: ExportData[], filename: string) {
  const csv = generateCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function generatePDFContent(data: ExportData[]): string {
  const groupedData = data.reduce((acc, item) => {
    const key = `${item.userName} (${item.userEmail})`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, ExportData[]>);

  let content = `
    <html>
      <head>
        <title>User Progress Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
          h2 { color: #555; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f8f9fa; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .summary { background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>User Progress Report</h1>
        <div class="summary">
          <p><strong>Generated:</strong> ${format(new Date(), 'PPP')}</p>
          <p><strong>Total Records:</strong> ${data.length}</p>
          <p><strong>Users Included:</strong> ${Object.keys(groupedData).length}</p>
        </div>
  `;

  Object.entries(groupedData).forEach(([user, records]) => {
    content += `
      <h2>${user}</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Value</th>
            <th>Unit</th>
            <th>Target</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    records.forEach(record => {
      content += `
        <tr>
          <td>${record.date}</td>
          <td>${record.type}</td>
          <td>${record.value}</td>
          <td>${record.unit}</td>
          <td>${record.target || 'N/A'}</td>
        </tr>
      `;
    });
    
    content += `
        </tbody>
      </table>
    `;
  });

  content += `
      </body>
    </html>
  `;
  
  return content;
}

export function downloadPDF(data: ExportData[], filename: string) {
  const htmlContent = generatePDFContent(data);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename.replace('.pdf', '.html'));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}