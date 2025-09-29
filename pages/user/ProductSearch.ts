import { Page } from 'playwright'; // Assuming Playwright; adjust if using another framework
import * as XLSX from 'xlsx';
import * as path from 'path';

// Assuming the Excel file is in a specific location; adjust the path as needed
const excelFilePath = path.join(__dirname, '../../data/products.xlsx'); // Example path; change to your actual file location

export function getProductName(): string | null {
    try {
        const workbook = XLSX.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0]; // Assuming the first sheet
        const sheet = workbook.Sheets[sheetName];
        
        // Assuming the product name is in cell A1; adjust as needed
        const cell = sheet['A1'];
        return cell ? cell.v : null;
    } catch (error) {
        console.error('Error reading Excel file:', error);
        return null;
    }
}
