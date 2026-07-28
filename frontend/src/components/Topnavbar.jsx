export default function TopNavbar({ collapsed, onToggleCollapse, onOpenMobile }) {
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    return (
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-orange-100 h-16 flex items-center gap-4 px-4 sm:px-6">
            {/* Mobile menu toggle */}
            <button
                onClick={onOpenMobile}
                className="lg:hidden text-stone-500 hover:text-gray-900 text-xl"
                aria-label="Open menu"
            >
                ☰
            </button>

            {/* Desktop collapse toggle */}
            <button
                onClick={onToggleCollapse}
                className="hidden lg:flex text-stone-400 hover:text-orange-500 transition-colors text-lg"
                aria-label="Toggle sidebar"
            >
                {collapsed ? '»' : '«'}
            </button>

            {/* Search (UI only) */}
            <div className="flex-1 max-w-md">
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
                        🔍
                    </span>
                    <input
                        type="text"
                        placeholder="Search orders, meals, staff..."
                        className="w-full bg-orange-50/60 border border-transparent focus:border-orange-300 focus:bg-white rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 placeholder:text-stone-400 outline-none transition-colors"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 ml-auto">
                {/* Notifications */}
                <button
                    className="relative w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    aria-label="Notifications"
                >
                    🔔
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500" />
                </button>

                {/* Settings shortcut */}
                <button
                    className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg text-stone-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    aria-label="Settings"
                >
                    ⚙️
                </button>

                <div className="h-8 w-px bg-orange-100 hidden sm:block" />

                {/* Profile */}
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-sm shrink-0">
                        {(user?.full_name || 'A')[0].toUpperCase()}
                    </div>
                    <div className="hidden sm:block leading-tight">
                        <div className="text-sm font-bold text-gray-900">
                            {user?.full_name || 'Admin'}
                        </div>
                        <div className="text-xs text-stone-400 capitalize">
                            {user?.role || 'admin'}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
