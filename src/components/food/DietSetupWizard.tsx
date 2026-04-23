export interface NutritionPlan {
    dailyTarget: number;
    macros: { protein: number; fat: number; carbs: number };
    petName?: string;
}

export function DietSetupWizard({ onComplete }: { onComplete: (plan: NutritionPlan) => void }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC] dark:bg-black">
            <div className="text-center p-8">
                <h2 className="text-xl font-black mb-4">Beslenme Planı Kurulumu</h2>
                <button
                    onClick={() => onComplete({ dailyTarget: 1200, macros: { protein: 30, fat: 20, carbs: 50 } })}
                    className="px-6 py-3 bg-green-500 text-white rounded-2xl font-bold"
                >
                    Varsayılan Plan ile Başla
                </button>
            </div>
        </div>
    );
}
