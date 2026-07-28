export default function DashboardCard({ icon, label, value, hint }) {
    return (
        <div className="group bg-white border border-orange-100 rounded-2xl shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-xl group-hover:bg-orange-100 transition-colors">
                    {icon}
                </div>
                {hint && (
                    <span className="text-xs font-semibold text-stone-400">{hint}</span>
                )}
            </div>
            <div className="text-2xl font-black text-gray-900">{value}</div>
            <div className="text-sm text-stone-500 mt-0.5">{label}</div>
        </div>
    );
}
