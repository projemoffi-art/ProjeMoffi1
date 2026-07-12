const fs = require('fs');
let content = fs.readFileSync('src/app/admin/market/page.tsx', 'utf8');

// 1. Add supabase import
content = content.replace(
    'import { cn } from "@/lib/utils";',
    'import { cn } from "@/lib/utils";\nimport { supabase } from "@/lib/supabase";'
);

// 2. Add businesses state
content = content.replace(
    'const [error, setError] = useState<string | null>(null);',
    'const [error, setError] = useState<string | null>(null);\n    const [businesses, setBusinesses] = useState<any[]>([]);'
);

// 3. Update loadData to fetch businesses
content = content.replace(
    'apiService.getAllOrders()',
    'apiService.getAllOrders(),\n                supabase.from(\'profiles\').select(\'id, full_name, username, role\').in(\'role\', [\'business\', \'admin\']).then(res => res.data || [])'
);
content = content.replace(
    'const [fetchedProducts, fetchedOrders] = await Promise.all([',
    'const [fetchedProducts, fetchedOrders, businessData] = await Promise.all(['
);
content = content.replace(
    'setOrders(fetchedOrders);',
    'setOrders(fetchedOrders);\n            setBusinesses(businessData);'
);

// 4. Add ownerId to newProduct and editForm state
content = content.replace(
    /isPrimeOnly: false\n    }\);/g,
    'isPrimeOnly: false,\n        ownerId: ""\n    });'
);

// 5. Update add product handle
content = content.replace(
    'tag: newProduct.tag || undefined',
    'tag: newProduct.tag || undefined,\n                ownerId: newProduct.ownerId || undefined'
);
content = content.replace(
    /isVetApproved: false,\n                isPrimeOnly: false\n            }\);/g,
    'isVetApproved: false,\n                isPrimeOnly: false,\n                ownerId: ""\n            });'
);

// 6. Update edit product start
content = content.replace(
    'isPrimeOnly: !!product.isPrimeOnly',
    'isPrimeOnly: !!product.isPrimeOnly,\n            ownerId: product.ownerId || ""'
);

// 7. Update edit product handle
content = content.replace(
    'tag: editForm.tag || null as any',
    'tag: editForm.tag || null as any,\n                ownerId: editForm.ownerId || undefined'
);

// 8. Add dropdown to add product modal (around category)
const addDropdown = `
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Satıcı Seçimi</label>
                                            <select
                                                value={newProduct.ownerId}
                                                disabled={isSubmitting}
                                                onChange={e => setNewProduct(prev => ({ ...prev, ownerId: e.target.value }))}
                                                className="w-full h-11 px-3 bg-black/40 border border-card-border rounded-xl text-xs text-white outline-none cursor-pointer focus:border-amber-500/30 transition-all font-medium"
                                            >
                                                <option value="">Satıcı Seçin (Zorunlu Değil)</option>
                                                {businesses.map(b => (
                                                    <option key={b.id} value={b.id}>
                                                        {b.role === 'admin' ? 'Moffi Merkezi' : (b.full_name || b.username)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
`;

content = content.replace(
    '<div className="grid grid-cols-2 gap-4">',
    `<div className="grid grid-cols-2 gap-4">\n${addDropdown}`
);

// But wait, there are two modals (add and edit).
// Let's replace the first '<div className="grid grid-cols-2 gap-4">' for add, and the second for edit.
// Wait, the easiest is to replace `<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategori</label>`
// Let's add the dropdown right AFTER the category select.
// Or just inject it inside the same grid.

const newDropdownHTMLAdd = `
                                            <select
                                                value={newProduct.category}
                                                disabled={isSubmitting}
                                                onChange={e => setNewProduct(prev => ({ ...prev, category: e.target.value as ShopCategory }))}
                                                className="w-full h-11 px-3 bg-black/40 border border-card-border rounded-xl text-xs text-white outline-none cursor-pointer focus:border-amber-500/30 transition-all font-medium"
                                            >
                                                <option value="food">Mama</option>
                                                <option value="snack">Atıştırmalık</option>
                                                <option value="toy">Oyuncak</option>
                                                <option value="care">Bakım</option>
                                                <option value="accessory">Aksesuar</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Satıcı</label>
                                            <select
                                                value={newProduct.ownerId}
                                                disabled={isSubmitting}
                                                onChange={e => setNewProduct(prev => ({ ...prev, ownerId: e.target.value }))}
                                                className="w-full h-11 px-3 bg-black/40 border border-card-border rounded-xl text-xs text-white outline-none cursor-pointer focus:border-amber-500/30 transition-all font-medium"
                                            >
                                                <option value="">Satıcı Seçin</option>
                                                {businesses.map(b => (
                                                    <option key={b.id} value={b.id}>
                                                        {b.role === 'admin' ? 'Moffi Merkezi' : (b.full_name || b.username)}
                                                    </option>
                                                ))}
                                            </select>
`;

const newDropdownHTMLEdit = `
                                            <select
                                                value={editForm.category}
                                                disabled={isSubmitting}
                                                onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value as ShopCategory }))}
                                                className="w-full h-11 px-3 bg-black/40 border border-card-border rounded-xl text-xs text-white outline-none cursor-pointer focus:border-amber-500/30 transition-all font-medium"
                                            >
                                                <option value="food">Mama</option>
                                                <option value="snack">Atıştırmalık</option>
                                                <option value="toy">Oyuncak</option>
                                                <option value="care">Bakım</option>
                                                <option value="accessory">Aksesuar</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Satıcı</label>
                                            <select
                                                value={editForm.ownerId}
                                                disabled={isSubmitting}
                                                onChange={e => setEditForm(prev => ({ ...prev, ownerId: e.target.value }))}
                                                className="w-full h-11 px-3 bg-black/40 border border-card-border rounded-xl text-xs text-white outline-none cursor-pointer focus:border-amber-500/30 transition-all font-medium"
                                            >
                                                <option value="">Satıcı Seçin</option>
                                                {businesses.map(b => (
                                                    <option key={b.id} value={b.id}>
                                                        {b.role === 'admin' ? 'Moffi Merkezi' : (b.full_name || b.username)}
                                                    </option>
                                                ))}
                                            </select>
`;

content = content.replace(
    /<select\s+value=\{newProduct\.category\}[\s\S]*?<\/select>/,
    newDropdownHTMLAdd
);

content = content.replace(
    /<select\s+value=\{editForm\.category\}[\s\S]*?<\/select>/,
    newDropdownHTMLEdit
);

// 9. Add seller label in the list
content = content.replace(
    '{product.isVetApproved && (\\s*<span className="bg-emerald-500\/10 text-emerald-500 text-\\[8px\\] font-black uppercase px-2 py-0\\.5 rounded-full">\\s*Vet Onaylı\\s*</span>\\s*)}',
    '{product.isVetApproved && (\n                                                                        <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">Vet Onaylı</span>\n                                                                    )}\n                                                                    {product.ownerId && (\n                                                                        <span className="bg-indigo-500/10 text-indigo-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">{businesses.find(b => b.id === product.ownerId)?.role === "admin" ? "Moffi Merkezi" : (businesses.find(b => b.id === product.ownerId)?.full_name || businesses.find(b => b.id === product.ownerId)?.username || "Satıcı")}</span>\n                                                                    )}'
);

fs.writeFileSync('src/app/admin/market/page.tsx', content);
console.log('Patched');
