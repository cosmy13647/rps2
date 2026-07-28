import useActivityFeed from '../../hooks/useActivityFeed';
import { timeAgo } from '../../api/timeAgo';

export default function RecentActivity() {
    const events = useActivityFeed();

    return (
        <div className="bg-white border border-orange-100 rounded-2xl shadow-sm p-5">
            <h3 className="font-black text-gray-900 mb-4">Recent Activity</h3>
            {events.length === 0 ? (
                <div className="text-center py-10 text-stone-400 text-sm">
                    Waiting for activity — new orders and payments will appear here live.
                </div>
            ) : (
                <ul className="space-y-1">
                    {events.map((event) => (
                        <li
                            key={event.id}
                            className="flex items-center gap-3 py-2.5 border-b border-orange-50 last:border-0"
                        >
                            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-sm shrink-0">
                                {event.icon}
                            </div>
                            <span className="flex-1 text-sm text-gray-700">{event.text}</span>
                            <span className="text-xs text-stone-400 shrink-0">{timeAgo(event.time)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
