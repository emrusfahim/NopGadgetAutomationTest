import * as XLSX from 'xlsx';

export function loadXlsxData(filePath: string, sheetIndex: number): any[] {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[sheetIndex];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });
    
    return data;
}

// Usage example:
// const data = loadXlsxData('testData/testData_user.xlsx', 0);