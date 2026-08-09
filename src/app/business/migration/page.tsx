"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    UploadCloud, FileSpreadsheet, CheckCircle2, 
    AlertCircle, Loader2, ArrowRight, Table as TableIcon,
    X, FileDown, RefreshCw, Upload, Smartphone, Users, Send, Settings
} from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { apiService } from "@/services/apiService";
import { BusinessSidebar as Sidebar } from "@/components/business/Sidebar";
import { showToast } from "@/lib/utils";

// Mapping fields definition
const REQUIRED_FIELDS = [
    { key: "rawName", label: "Müşteri İsmi (Zorunlu)" },
    { key: "rawPhone", label: "Telefon (Zorunlu)" },
    { key: "petName", label: "Pet Adı" },
    { key: "petSpecies", label: "Tür (Kedi/Köpek)" },
    { key: "petBreed", label: "Cins" },
    { key: "legacyNotes", label: "Eski Notlar" }
];

export default function MigrationPage() {
    const [activeTab, setActiveTab] = useState<'import' | 'patients'>('import');
    
    // Import state
    const [file, setFile] = useState<File | null>(null);
    const [fileData, setFileData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [results, setResults] = useState<{ success: number; error: number; logs: string[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Patients & SMS State
    const [patients, setPatients] = useState<any[]>([]);
    const [smsStatus, setSmsStatus] = useState<{provider: string, sender_id: string, is_active: boolean} | null>(null);
    const [isLoadingPatients, setIsLoadingPatients] = useState(false);
    
    // SMS Settings Form State
    const [showSmsForm, setShowSmsForm] = useState(false);
    const [smsForm, setSmsForm] = useState({ provider: 'netgsm', apiUsername: '', apiKey: '', senderId: '' });
    const [isSavingSms, setIsSavingSms] = useState(false);

    useEffect(() => {
        if (activeTab === 'patients') {
            loadPatientsAndSms();
        }
    }, [activeTab]);

    const loadPatientsAndSms = async () => {
        setIsLoadingPatients(true);
        try {
            const [pats, status] = await Promise.all([
                apiService.getMyUnclaimedPatients(),
                apiService.getMySmsStatus()
            ]);
            setPatients(pats);
            setSmsStatus(status);
        } catch (e: any) {
            showToast("Hata", "Veriler yüklenemedi", "error");
        } finally {
            setIsLoadingPatients(false);
        }
    };

    const handleSaveSmsSettings = async () => {
        if (!smsForm.apiUsername || !smsForm.apiKey || !smsForm.senderId) {
            showToast("Hata", "Tüm alanları doldurun", "error");
            return;
        }
        setIsSavingSms(true);
        try {
            await apiService.setClinicSmsSettings(smsForm.provider, smsForm.apiUsername, smsForm.apiKey, smsForm.senderId);
            showToast("Başarılı", "SMS ayarları kaydedildi", "success");
            setShowSmsForm(false);
            loadPatientsAndSms();
        } catch (e: any) {
            showToast("Hata", e.message, "error");
        } finally {
            setIsSavingSms(false);
        }
    };

    const handleSendSms = async (patientId: string) => {
        try {
            const res = await apiService.sendClaimSms(patientId);
            if (res.mode === 'mock') {
                showToast("Bilgi (Mock Mod)", "SMS sağlayıcı bağlı olmadığı için gerçek SMS atılmadı, işlem loglandı.", "info");
            } else {
                showToast("Başarılı", "SMS başarıyla gönderildi.", "success");
            }
            loadPatientsAndSms(); // Refresh status
        } catch (e: any) {
            showToast("Hata", "SMS gönderilemedi: " + e.message, "error");
        }
    };

    // ... handleFileSelect, autoMapHeaders, handleImport methods are identical to before ...
    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;
        setFile(selected);
        setResults(null);
        setMapping({});
        
        const isCsv = selected.name.endsWith('.csv');
        
        if (isCsv) {
            Papa.parse(selected, {
                header: true,
                skipEmptyLines: true,
                complete: (result) => {
                    if (result.meta.fields) setHeaders(result.meta.fields);
                    setFileData(result.data);
                    autoMapHeaders(result.meta.fields || []);
                }
            });
        } else {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                if (data.length > 0) {
                    const parsedHeaders = data[0] as string[];
                    setHeaders(parsedHeaders);
                    const rows = data.slice(1).map((row: any) => {
                        const rowObj: any = {};
                        parsedHeaders.forEach((h, i) => { rowObj[h] = row[i]; });
                        return rowObj;
                    });
                    setFileData(rows);
                    autoMapHeaders(parsedHeaders);
                }
            };
            reader.readAsBinaryString(selected);
        }
    };

    const autoMapHeaders = (availableHeaders: string[]) => {
        const newMapping: Record<string, string> = {};
        const lowerHeaders = availableHeaders.map(h => h.toLowerCase());
        const findMatch = (keywords: string[]) => {
            const idx = lowerHeaders.findIndex(h => keywords.some(k => h.includes(k)));
            return idx !== -1 ? availableHeaders[idx] : "";
        };
        newMapping.rawName = findMatch(["isim", "ad", "müşteri", "name"]);
        newMapping.rawPhone = findMatch(["telefon", "tel", "gsm", "phone"]);
        newMapping.petName = findMatch(["pet", "hayvan", "hasta"]);
        newMapping.petSpecies = findMatch(["tür", "species"]);
        newMapping.petBreed = findMatch(["cins", "irk", "breed"]);
        newMapping.legacyNotes = findMatch(["not", "note", "açıklama"]);
        setMapping(newMapping);
    };

    const handleImport = async () => {
        if (!mapping.rawName || !mapping.rawPhone) {
            showToast("Hata", "İsim ve Telefon eşleştirmesi zorunludur!", "error");
            return;
        }
        setIsUploading(true);
        setProgress({ current: 0, total: fileData.length });
        let success = 0, error = 0, logs: string[] = [];

        for (let i = 0; i < fileData.length; i++) {
            const row = fileData[i];
            const nameVal = row[mapping.rawName]?.toString().trim();
            const phoneVal = row[mapping.rawPhone]?.toString().trim();
            setProgress(prev => ({ ...prev, current: i + 1 }));

            if (!nameVal || !phoneVal) {
                error++; logs.push(`Satır ${i + 1} atlandı: İsim veya telefon boş.`);
                continue;
            }
            try {
                await apiService.insertUnclaimedPatient({
                    rawName: nameVal, rawPhone: phoneVal,
                    petName: mapping.petName ? row[mapping.petName]?.toString() : undefined,
                    petSpecies: mapping.petSpecies ? row[mapping.petSpecies]?.toString() : undefined,
                    petBreed: mapping.petBreed ? row[mapping.petBreed]?.toString() : undefined,
                    legacyNotes: mapping.legacyNotes ? row[mapping.legacyNotes]?.toString() : undefined,
                });
                success++;
            } catch (err: any) {
                error++; logs.push(`Satır ${i + 1} hata: ${err.message}`);
            }
        }
        setIsUploading(false);
        setResults({ success, error, logs });
        if (success > 0) showToast("Başarılı", `${success} kayıt başarıyla içe aktarıldı.`, "success");
    };

    return (
        <div className="flex min-h-screen bg-slate-50/50 dark:bg-slate-950">
            <Sidebar />
            <main className="flex-1 lg:ml-64 p-6 overflow-y-auto">
                <div className="max-w-5xl mx-auto space-y-6">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <FileSpreadsheet className="w-6 h-6 text-primary-500" />
                                Veri Taşıma
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Eski sisteminizdeki verileri aktarın ve müşterilerinizi davet edin.
                            </p>
                        </div>
                        
                        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <button 
                                onClick={() => setActiveTab('import')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'import' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <UploadCloud className="w-4 h-4 inline-block mr-2" />
                                İçe Aktar
                            </button>
                            <button 
                                onClick={() => setActiveTab('patients')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'patients' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <Users className="w-4 h-4 inline-block mr-2" />
                                Bekleyen Hastalar
                            </button>
                        </div>
                    </div>

                    {activeTab === 'import' && (
                        <AnimatePresence mode="wait">
                            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-6">
                                {!fileData.length && !results && (
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
                                        <div className="w-20 h-20 bg-primary-50 dark:bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <UploadCloud className="w-10 h-10 text-primary-500" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Dosya Yükle</h3>
                                        <p className="text-slate-500 mb-8 max-w-md mx-auto">Sadece .csv veya .xlsx formatında dosyalar desteklenmektedir.</p>
                                        <input type="file" accept=".csv,.xlsx" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                                        <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-medium transition-colors">
                                            <Upload className="w-5 h-5" /> Dosya Seç
                                        </button>
                                    </div>
                                )}
                                {/* Mapping and Upload views */}
                                {fileData.length > 0 && !results && (
                                    <div className="space-y-6">
                                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                                    <TableIcon className="w-5 h-5 text-primary-500" /> Sütun Eşleştirme
                                                </h3>
                                                <button onClick={() => { setFile(null); setFileData([]); }} className="text-slate-500 hover:text-slate-700">
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {REQUIRED_FIELDS.map(field => (
                                                    <div key={field.key} className="space-y-1.5">
                                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{field.label}</label>
                                                        <select value={mapping[field.key] || ""} onChange={(e) => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                                                            <option value="">-- Sütun Seçin --</option>
                                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 overflow-hidden">
                                            <h3 className="text-lg font-semibold mb-4">Önizleme (İlk 5 Satır)</h3>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm whitespace-nowrap">
                                                    <thead className="text-slate-500 border-b border-slate-200">
                                                        <tr>{headers.map((h, i) => <th key={i} className="pb-3 px-4 font-medium">{h}</th>)}</tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {fileData.slice(0, 5).map((row, i) => (
                                                            <tr key={i} className="text-slate-700">{headers.map((h, j) => <td key={j} className="py-3 px-4 max-w-[200px] truncate">{row[h]?.toString() || '-'}</td>)}</tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                                            {isUploading ? (
                                                <div className="space-y-4 w-full max-w-md">
                                                    <div className="flex justify-between text-sm font-medium"><span>Aktarılıyor...</span><span className="text-primary-500">{progress.current} / {progress.total}</span></div>
                                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <button onClick={handleImport} className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-xl font-medium transition-colors">
                                                    İçe Aktarımı Başlat <ArrowRight className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {results && (
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
                                        <div className="flex flex-col items-center text-center mb-8">
                                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4"><CheckCircle2 className="w-8 h-8" /></div>
                                            <h2 className="text-2xl font-bold text-slate-900">İşlem Tamamlandı</h2>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
                                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                                                <div className="text-3xl font-bold text-green-600 mb-1">{results.success}</div>
                                                <div className="text-sm font-medium text-green-700">Başarılı</div>
                                            </div>
                                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                                                <div className="text-3xl font-bold text-red-600 mb-1">{results.error}</div>
                                                <div className="text-sm font-medium text-red-700">Hatalı / Atlanan</div>
                                            </div>
                                        </div>
                                        {results.logs.length > 0 && (
                                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-60 overflow-y-auto font-mono text-xs text-slate-600 space-y-1">
                                                {results.logs.map((log, i) => <div key={i} className="flex gap-2"><AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" /><span>{log}</span></div>)}
                                            </div>
                                        )}
                                        <div className="mt-8 flex justify-center">
                                            <button onClick={() => { setFileData([]); setResults(null); setFile(null); }} className="inline-flex items-center gap-2 bg-slate-100 text-slate-900 px-6 py-2.5 rounded-lg font-medium transition-colors">
                                                <RefreshCw className="w-4 h-4" /> Yeni Dosya Yükle
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}

                    {activeTab === 'patients' && (
                        <AnimatePresence mode="wait">
                            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-6">
                                {/* SMS Banner */}
                                {!smsStatus?.is_active ? (
                                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex gap-3">
                                            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-400">SMS Sağlayıcı Bağlı Değil</h4>
                                                <p className="text-sm text-amber-700 dark:text-amber-500/80 mt-0.5">
                                                    Davetler mock (test) modunda loglanacak, gerçekte gönderilmeyecek.
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setShowSmsForm(!showSmsForm)}
                                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0 whitespace-nowrap"
                                        >
                                            <Settings className="w-4 h-4 inline-block mr-2" />
                                            Bağla
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                                            <div>
                                                <h4 className="text-sm font-semibold text-green-900 dark:text-green-400">SMS Sağlayıcı Bağlı ({smsStatus.provider})</h4>
                                                <p className="text-sm text-green-700 dark:text-green-500/80 mt-0.5">Gönderen Adı: {smsStatus.sender_id}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setShowSmsForm(!showSmsForm)}
                                            className="text-green-700 dark:text-green-500 text-sm font-medium hover:underline"
                                        >
                                            Ayarları Güncelle
                                        </button>
                                    </div>
                                )}

                                {/* SMS Settings Form */}
                                {showSmsForm && (
                                    <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 overflow-hidden">
                                        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                                            <Smartphone className="w-5 h-5 text-primary-500" />
                                            SMS Ayarları (Netgsm / İleti Merkezi)
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sağlayıcı</label>
                                                <select 
                                                    value={smsForm.provider} 
                                                    onChange={e => setSmsForm({...smsForm, provider: e.target.value})}
                                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                                >
                                                    <option value="netgsm">Netgsm</option>
                                                    <option value="iletimerkezi">İleti Merkezi</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kullanıcı Adı (API Username)</label>
                                                <input 
                                                    type="text" 
                                                    value={smsForm.apiUsername} 
                                                    onChange={e => setSmsForm({...smsForm, apiUsername: e.target.value})}
                                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">API Şifresi / Key</label>
                                                <input 
                                                    type="password" 
                                                    value={smsForm.apiKey} 
                                                    onChange={e => setSmsForm({...smsForm, apiKey: e.target.value})}
                                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gönderen Adı (Başlık)</label>
                                                <input 
                                                    type="text" 
                                                    value={smsForm.senderId} 
                                                    onChange={e => setSmsForm({...smsForm, senderId: e.target.value})}
                                                    placeholder="Örn: MOFFIVET"
                                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => setShowSmsForm(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900">
                                                İptal
                                            </button>
                                            <button 
                                                onClick={handleSaveSmsSettings} 
                                                disabled={isSavingSms}
                                                className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                                            >
                                                {isSavingSms ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                Kaydet
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Unclaimed Patients List */}
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                                    <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">İçe Aktarılan Bekleyen Hastalar</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        {isLoadingPatients ? (
                                            <div className="p-12 flex justify-center text-primary-500"><Loader2 className="w-8 h-8 animate-spin" /></div>
                                        ) : patients.length === 0 ? (
                                            <div className="p-12 text-center text-slate-500">Henüz kimse içe aktarılmamış.</div>
                                        ) : (
                                            <table className="w-full text-left text-sm whitespace-nowrap">
                                                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                                                    <tr>
                                                        <th className="py-3 px-4 font-medium">Müşteri</th>
                                                        <th className="py-3 px-4 font-medium">Telefon</th>
                                                        <th className="py-3 px-4 font-medium">Pet</th>
                                                        <th className="py-3 px-4 font-medium">Durum</th>
                                                        <th className="py-3 px-4 font-medium text-right">İşlem</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                                    {patients.map(p => (
                                                        <tr key={p.id} className="text-slate-700 dark:text-slate-300">
                                                            <td className="py-3 px-4 font-medium">{p.raw_name}</td>
                                                            <td className="py-3 px-4">{p.normalized_phone}</td>
                                                            <td className="py-3 px-4">{p.pet_name || '-'}</td>
                                                            <td className="py-3 px-4">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'sms_sent' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : p.status === 'claimed' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                                    {p.status === 'sms_sent' ? 'SMS Gönderildi' : p.status === 'claimed' ? 'Kaydını Aldı' : 'Bekliyor'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4 text-right">
                                                                <button 
                                                                    onClick={() => handleSendSms(p.id)}
                                                                    disabled={p.status === 'claimed'}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/20 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                                                                >
                                                                    <Send className="w-3.5 h-3.5" />
                                                                    Davet SMS
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    )}

                </div>
            </main>
        </div>
    );
}
