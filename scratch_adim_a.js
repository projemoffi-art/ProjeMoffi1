const fs = require('fs');
const path = 'c:/Users/uveys/OneDrive/Masaüstü/ProjeMoffi1/src/app/business/appointments/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
    /localStorage\.setItem\('moffi_confirmed_appointments', JSON\.stringify\(INITIAL_APPOINTMENTS\)\);/g,
    `localStorage.setItem('moffi_confirmed_appointments', JSON.stringify([]));`
);
code = code.replace(
    /setAppointments\(INITIAL_APPOINTMENTS\);/g,
    `setAppointments([]);`
);

fs.writeFileSync(path, code, 'utf8');
console.log("Done");
