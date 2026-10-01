import { Workbook } from 'exceljs';
import { Response } from 'express';

export class ExcelParser {
  async exportToExcel(
    data: any[],
    columns: any[],
    res: Response,
    filename: string,
    sheetName: string,
    /** Columnas (1-based) que van centradas. Si se omite, se centran las de la hoja antigua. */
    columnasCentradas: number[] = [1, 2, 6, 10],
  ) {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = columns;

    worksheet.addRows(data);

    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '0F172A' }, 
      };
      cell.font = {
        name: 'Segoe UI',
        size: 11,
        bold: true, 
        color: { argb: 'FFFFFF' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        bottom: { style: 'medium', color: { argb: '0284C7' } }, // Línea azul de acento
      };
    });
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      row.height = 22;
      const isEven = rowNumber % 2 === 0;

      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Segoe UI', size: 10, color: { argb: '334155' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'F8FAFC' : 'FFFFFF' },
        };

        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } },
        };

        if (columnasCentradas.includes(colNumber)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });
    });
    worksheet.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell!({ includeEmpty: true }, (cell) => {
        const len = cell.value ? cell.value.toString().length : 10;
        if (len > maxLen) maxLen = len;
      });
      column.width = Math.max(maxLen + 4, 12);
    });
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}