const fs = require('fs');
let content = fs.readFileSync('src/app/petshop/page.tsx', 'utf8');

// 1. Remove the old Stripe title JSX
content = content.replace(
    /\{checkoutMode === 'stripe' \? 'Stripe Gateway' : 'Moffi Secure Simulation'\}/g,
    "'Moffi Secure Checkout'"
);

// 2. Remove the {checkoutMode === 'stripe'} ternary block that wraps the Custom UI
content = content.replace(
    /\{checkoutMode === 'stripe' && paymentClientSecret \? \([\s\S]*?<\/Elements>\s*\)\s*:\s*\(\s*\{\/\* CUSTOM SIMULATED CHECKOUT FORM \*\/\}/g,
    ""
);

// 3. Keep PayTR section clean, remove Custom Card Form section
const step2PaymentStr = "{/* STEP 2: PAYMENT */}\r\n                                                {checkoutStep === 'payment' && (";
const idxStart = content.indexOf("{/* STEP 2: PAYMENT */}");
if (idxStart !== -1) {
    const endStr = "                                                    </div>\r\n                                                )}\r\n                                            </>\r\n                                        )}";
    const idxEnd = content.indexOf(endStr, idxStart);
    if (idxEnd !== -1) {
        const paytrBlock = `
                                                {/* STEP 2: PAYMENT */}
                                                {checkoutStep === 'payment' && (
                                                    <div className="space-y-4">
                                                        {checkoutMode === 'paytr' && paytrToken && (
                                                            <div className="w-full flex flex-col items-center">
                                                                <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-xs space-y-2 mb-4 font-semibold text-gray-400">
                                                                    <div className="flex justify-between text-xs font-black text-white">
                                                                        <span>SipariY Tutar</span>
                                                                        <span className="text-orange-500">'{(cartTotal || 0).toLocaleString('tr-TR')}</span>
                                                                    </div>
                                                                </div>
                                                                <iframe 
                                                                    src={\`https://www.paytr.com/odeme/guvenli/\${paytrToken}\`} 
                                                                    id="paytriframe" 
                                                                    frameBorder="0" 
                                                                    scrolling="yes" 
                                                                    style={{ width: "100%", height: "600px" }}
                                                                />
                                                            </div>
                                                        )}
`;
        content = content.substring(0, idxStart) + paytrBlock + content.substring(idxEnd);
    }
}

// Ensure checkoutErrors maps correctly and no missing variables
fs.writeFileSync('src/app/petshop/page.tsx', content, 'utf8');
console.log("Cleanup complete!");
