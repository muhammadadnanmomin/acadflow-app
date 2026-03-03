"use client";

import { Calendar } from "lucide-react";

export function CalendarView() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="relative">
                <Calendar className="h-16 w-16 opacity-30" />
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-indigo-600">✦</span>
                </div>
            </div>
            <p className="text-lg font-semibold mt-4 text-foreground">
                Calendar View
            </p>
            <p className="text-sm mt-1 max-w-xs text-center">
                Full calendar integration is coming soon. Use the Track View for a
                visual timeline or the List View for a detailed breakdown.
            </p>
            <div className="mt-6 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium">
                🚧 Coming Soon
            </div>
        </div>
    );
}
