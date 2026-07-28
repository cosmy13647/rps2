const ACTIONS = [
    { icon: '🍽️', label: 'Add Meal' },
    { icon: '🧑‍🍳', label: 'Add Waiter' },
    { icon: '⏱️', label: 'Open Shift' },
    { icon: '📈', label: 'Generate Report' },
];

export default function QuickActions() {
    return (
        <div className="bg-white border border-orange-100 rounded-2xl shadow-sm p-5">
            <h3 className="font-black text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
                {ACTIONS.map((action) => (
                    <button
                        key={action.label}
                        className="flex flex-col items-center justify-center gap-2 py-5 rounded-xl border border-orange-100 text-stone-600 hover:border-orange-400 hover:bg-orange-50/60 hover:text-orange-600 transition-colors"
                    >
                        <span className="text-2xl">{action.icon}</span>
                        <span className="text-sm font-bold">{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
