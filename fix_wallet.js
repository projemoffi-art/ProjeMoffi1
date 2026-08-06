const fs = require('fs');
let file = fs.readFileSync('src/components/profile/WalletTab.tsx', 'utf8');

// 1. Add imports
file = file.replace(/import \{ WALLET_TRANSACTIONS \} from '@\/lib\/mockData';\r?\n/, '');
file = file.replace(/import \{ useAuth \} from '@\/context\/AuthContext';\r?\n/, 
    "import { useAuth } from '@/context/AuthContext';\nimport { apiService } from '@/services/apiService';\nimport { WalletTransaction } from '@/services/types';\n");

// 2. Change state
file = file.replace(/const \[expandedCard, setExpandedCard\] = useState<string \| null>\(null\);\r?\n\r?\n    const balance = user\?\.moffi_coins \|\| 0;\r?\n    const transactions = WALLET_TRANSACTIONS;/,
    "const [expandedCard, setExpandedCard] = useState<string | null>(null);\n    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);\n    const [isLoading, setIsLoading] = useState(true);\n\n    const balance = user?.moffi_coins || 0;\n\n    React.useEffect(() => {\n        const fetchTxs = async () => {\n            if (!user?.id) return;\n            try {\n                setIsLoading(true);\n                const txs = await apiService.getWalletTransactions(user.id);\n                setTransactions(txs);\n            } catch (err) {\n                console.error(err);\n            } finally {\n                setIsLoading(false);\n            }\n        };\n        fetchTxs();\n    }, [user?.id]);");

// 3. Fix list header
file = file.replace(/<div className="px-5 py-2 bg-black\/5 dark:bg-white\/5 rounded-2xl border border-card-border backdrop-blur-xl">\r?\n\s*<span className="text-\[10px\] font-black text-gray-500 uppercase tracking-\[0\.3em\]">Nisan 2024<\/span>\r?\n\s*<\/div>/,
    "");

// 4. Update the map block
const mapRegex = /<div className="space-y-4 px-1 sm:px-2">\r?\n\s*\{transactions\.map\(tx => \([\s\S]*?\}\)\)\}\r?\n\s*<\/div>/;

const newMap = \<div className="space-y-4 px-1 sm:px-2">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center bg-white/[0.02] rounded-[3rem] border border-card-border">
                            <Coins className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mb-4" />
                            <h3 className="font-bold text-white mb-1">Henüz Ýþlem Yok</h3>
                            <p className="text-sm text-gray-400">Cüzdan hareketleriniz burada görünecektir.</p>
                        </div>
                    ) : (
                        transactions.map((tx: WalletTransaction, index) => {
                            const isPositive = tx.type === 'earned' || tx.type === 'system' || tx.type === 'gift';
                            let Icon = Zap;
                            if (tx.type === 'earned') Icon = ArrowUpRight;
                            else if (tx.type === 'spent') Icon = ShoppingBag;
                            else if (tx.type === 'gift') Icon = Gift;
                            else if (tx.type === 'system') Icon = Coins;

                            return (
                                <div key={tx.id || index} className="bg-white/[0.02] border border-card-border p-4 sm:p-7 rounded-[2rem] sm:rounded-[3rem] flex items-center justify-between group hover:bg-black/5 dark:bg-white/5 transition-all cursor-pointer relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex items-center gap-4 sm:gap-6 relative z-10">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-black/40 rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 shadow-2xl border border-card-border">
                                            <Icon className={cn("w-6 h-6 sm:w-8 sm:h-8", isPositive ? "text-emerald-400" : "text-white")} />
                                        </div>
                                        <div className="text-left">
                                            <h4 className="text-white font-black text-sm sm:text-base uppercase tracking-tight italic">{tx.description}</h4>
                                            <div className="flex items-center gap-1.5 mt-1 sm:mt-1.5">
                                                <div className={cn("w-1 h-1 rounded-full", isPositive ? "bg-emerald-500" : "bg-orange-500")} />
                                                <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">
                                                    {new Date(tx.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right relative z-10">
                                        <div className="flex items-baseline gap-1">
                                            <p className={cn(
                                                "text-xl sm:text-2xl font-black italic tracking-tighter",
                                                isPositive ? "text-emerald-400" : "text-white"
                                            )}>
                                                {isPositive ? \+\\ : \-\\}
                                            </p>
                                            <span className="text-[9px] sm:text-[10px] font-black text-black/40 dark:text-white/30 tracking-tighter uppercase">PC</span>
                                        </div>
                                        <p className="text-[8px] sm:text-[9px] font-black text-white/10 uppercase tracking-[0.3em] mt-1">Tamamlandý</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>\;

file = file.replace(mapRegex, newMap);
fs.writeFileSync('src/components/profile/WalletTab.tsx', file);
console.log('WalletTab fixed.');
