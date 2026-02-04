
import * as fs from 'fs';
import * as path from 'path';

const filesToCheck = [
    'app/dashboard/_components/BulkRegistrationCalendar.tsx',
    'app/dashboard/_components/EmployeeDashboard.tsx',
    'app/dashboard/_components/admin/ForecastCards.tsx',
    'app/dashboard/_components/admin/AdminManagerDashboard.tsx',
    'app/api/v1/orders/history/route.ts',
    'app/dashboard/kitchen/_components/KitchenDashboard.tsx'
];

const forbiddenPatterns = [
    // straightforward UTC conversion
    'toISOString().split(\'T\')[0]',
    'new Date().toISOString()',
    // also checking for manual string concatenation that looks risky if found implies old habits
];

const requiredPatterns = {
    'app/api/v1/orders/history/route.ts': ['getVietnamDateString'],
    'app/dashboard/kitchen/_components/KitchenDashboard.tsx': ['toLocalDateString'],
    'app/dashboard/_components/EmployeeDashboard.tsx': ['toLocalDateString'],
    'app/dashboard/_components/admin/ForecastCards.tsx': ['toLocalDateString'],
    'app/dashboard/_components/admin/AdminManagerDashboard.tsx': ['toLocalDateString']
};

let hasErrors = false;
const projectRoot = process.cwd();

console.log('🔍 Starting Timezone Logic Verification...\n');

filesToCheck.forEach(file => {
    const filePath = path.join(projectRoot, file);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${file}`);
        hasErrors = true;
        return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    let fileHasError = false;

    // Check for forbidden patterns
    forbiddenPatterns.forEach(pattern => {
        if (content.includes(pattern)) {
            // Exceptions: sometimes we use toISOString for timestamps (e.g. created_at), not YYYY-MM-DD date logic
            // But .split('T')[0] is almost always for date logic.
            if (pattern === 'toISOString().split(\'T\')[0]') {
                console.error(`❌ Forbidden pattern found in ${file}: "${pattern}"`);
                fileHasError = true;
            }
        }
    });

    // Check for required patterns
    const required = requiredPatterns[file as keyof typeof requiredPatterns];
    if (required) {
        required.forEach(pattern => {
            if (!content.includes(pattern)) {
                console.error(`❌ Missing required implementation in ${file}: "${pattern}" not found.`);
                fileHasError = true;
            }
        });
    }

    if (!fileHasError) {
        console.log(`✅ ${file} passed checks.`);
    } else {
        hasErrors = true;
    }
});

if (hasErrors) {
    console.error('\n❌ Verification FAILED: Timezone issues detected.');
    process.exit(1);
} else {
    console.log('\n✅ Verification PASSED: All checked files use correct date helpers.');
}
