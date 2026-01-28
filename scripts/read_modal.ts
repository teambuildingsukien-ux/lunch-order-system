
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.resolve('app/dashboard/_components/admin/employees/AddEmployeeModal.tsx');
const content = fs.readFileSync(filePath, 'utf-8');

// Find the block around line 140
const lines = content.split('\n');
const start = 138;
const end = 153;

console.log('---START---');
console.log(lines.slice(start, end).join('\n'));
console.log('---END---');
