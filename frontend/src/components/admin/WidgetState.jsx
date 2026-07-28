
export function SkeletonRows({ count = 4, height = 'h-14' }) {
    return (
        <div className="space-y-2 animate-pulse">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className={`${height} bg-orange-50 rounded-xl`} />
            ))}
        </div>
    );
}

export function SkeletonCards({ count = 6 }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="h-24 bg-orange-50 rounded-2xl" />
            ))}
        </div>
    );
}

export default function WidgetState({ loading, error, empty, emptyMessage = 'Nothing here yet', skeleton, onRetry, children }) {
    if (loading) return skeleton;

    if (error) {
        return (
            <div className="text-center py-10">
                <p className="text-red-500 text-sm mb-2">⚠️ {error}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                    >
                        Try again
                    </button>
                )}
            </div>
        );
    }

    if (empty) {
        return (
            <div className="text-center py-10 text-stone-400 text-sm">
                {emptyMessage}
            </div>
        );
    }

    return children;
}
