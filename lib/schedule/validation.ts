import { z } from "zod";

// ============================================================
// Session Form Validation — Mode-Based Dynamic Fields
// ============================================================

export const dayFormSchema = z.object({
    day_number: z.number().int().min(1, "Day number must be at least 1"),
    date: z.string().min(1, "Date is required"),
    label: z.string().optional(),
});

export const trackFormSchema = z.object({
    name: z.string().min(1, "Track name is required"),
    room_name: z.string().optional(),
    color_code: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
    sort_order: z.number().int().optional(),
});

export const sessionFormSchema = z
    .object({
        day_id: z.string().uuid("Day is required"),
        track_id: z.string().uuid("Track is required"),
        title: z.string().min(1, "Session title is required"),
        session_type: z.enum([
            "keynote",
            "technical",
            "invited",
            "workshop",
            "ceremony",
            "break",
        ]),
        mode: z.enum(["offline", "online", "hybrid"]),
        start_time: z.string().min(1, "Start time is required"),
        end_time: z.string().min(1, "End time is required"),
        venue: z.string().optional(),
        room: z.string().optional(),
        platform: z.string().optional(),
        meeting_link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
        timezone: z.string().optional(),
        chairperson_id: z.string().uuid().optional().or(z.literal("")),
        coordinator_id: z.string().uuid().optional().or(z.literal("")),
        paper_ids: z.array(z.string().uuid()).optional(),
    })
    .superRefine((data, ctx) => {
        // Offline or Hybrid → venue + room required
        if (data.mode === "offline" || data.mode === "hybrid") {
            if (!data.venue || data.venue.trim() === "") {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Venue is required for offline/hybrid sessions",
                    path: ["venue"],
                });
            }
            if (!data.room || data.room.trim() === "") {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Room is required for offline/hybrid sessions",
                    path: ["room"],
                });
            }
        }

        // Online or Hybrid → meeting_link + timezone required
        if (data.mode === "online" || data.mode === "hybrid") {
            if (!data.meeting_link || data.meeting_link.trim() === "") {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Meeting link is required for online/hybrid sessions",
                    path: ["meeting_link"],
                });
            }
            if (!data.timezone || data.timezone.trim() === "") {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Timezone is required for online/hybrid sessions",
                    path: ["timezone"],
                });
            }
        }

        // End time must be after start time
        if (data.start_time && data.end_time) {
            if (new Date(data.end_time) <= new Date(data.start_time)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "End time must be after start time",
                    path: ["end_time"],
                });
            }
        }
    });

export type SessionFormValues = z.infer<typeof sessionFormSchema>;
export type DayFormValues = z.infer<typeof dayFormSchema>;
export type TrackFormValues = z.infer<typeof trackFormSchema>;
