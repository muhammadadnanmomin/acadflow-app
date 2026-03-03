import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    Link,
    StyleSheet,
    renderToBuffer,
} from "@react-pdf/renderer";
import type { ScheduleExport } from "../types";

// ============================================================
// Professional Conference Schedule PDF Generator
// ============================================================

const COLORS = {
    primary: "#4f46e5",
    primaryLight: "#eef2ff",
    dark: "#1e293b",
    text: "#334155",
    muted: "#64748b",
    border: "#e2e8f0",
    white: "#ffffff",
    green: "#16a34a",
    greenBg: "#f0fdf4",
    blue: "#2563eb",
    blueBg: "#eff6ff",
    orange: "#ea580c",
    orangeBg: "#fff7ed",
    gray: "#f8fafc",
};

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: "Helvetica",
        fontSize: 10,
        color: COLORS.text,
    },

    // Cover
    coverSection: {
        marginBottom: 30,
        paddingBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: COLORS.primary,
    },
    conferenceTitle: {
        fontSize: 24,
        fontFamily: "Helvetica-Bold",
        color: COLORS.primary,
        marginBottom: 6,
    },
    coverMeta: {
        fontSize: 10,
        color: COLORS.muted,
        marginBottom: 2,
    },

    // Day
    dayHeader: {
        backgroundColor: COLORS.primary,
        color: COLORS.white,
        padding: 10,
        borderRadius: 4,
        marginBottom: 12,
        marginTop: 20,
    },
    dayHeaderText: {
        fontSize: 14,
        fontFamily: "Helvetica-Bold",
        color: COLORS.white,
    },
    dayDateText: {
        fontSize: 9,
        color: "#c7d2fe",
        marginTop: 2,
    },

    // Track
    trackHeader: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        backgroundColor: COLORS.gray,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 3,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
        marginBottom: 8,
        marginTop: 10,
    },
    trackName: {
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        color: COLORS.dark,
    },
    trackRoom: {
        fontSize: 9,
        color: COLORS.muted,
        marginLeft: 8,
    },

    // Session
    sessionCard: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 4,
        padding: 10,
        marginBottom: 8,
        marginLeft: 6,
    },
    sessionHeader: {
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
        alignItems: "flex-start" as const,
        marginBottom: 6,
    },
    sessionTitle: {
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        color: COLORS.dark,
        flex: 1,
        marginRight: 8,
    },
    badgeRow: {
        flexDirection: "row" as const,
        gap: 4,
    },
    badge: {
        fontSize: 7,
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 8,
        fontFamily: "Helvetica-Bold",
        textTransform: "uppercase" as const,
    },
    typeBadge: {
        backgroundColor: COLORS.primaryLight,
        color: COLORS.primary,
    },
    modeBadgeOffline: {
        backgroundColor: COLORS.blueBg,
        color: COLORS.blue,
    },
    modeBadgeOnline: {
        backgroundColor: COLORS.greenBg,
        color: COLORS.green,
    },
    modeBadgeHybrid: {
        backgroundColor: COLORS.orangeBg,
        color: COLORS.orange,
    },
    sessionTime: {
        fontSize: 9,
        color: COLORS.muted,
        marginBottom: 4,
    },
    sessionDetail: {
        fontSize: 9,
        color: COLORS.text,
        marginBottom: 2,
    },
    detailLabel: {
        fontFamily: "Helvetica-Bold",
        color: COLORS.dark,
    },

    // Presentations table
    tableContainer: {
        marginTop: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 3,
    },
    tableHeader: {
        flexDirection: "row" as const,
        backgroundColor: COLORS.gray,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingVertical: 4,
        paddingHorizontal: 6,
    },
    tableRow: {
        flexDirection: "row" as const,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingVertical: 3,
        paddingHorizontal: 6,
    },
    tableRowLast: {
        flexDirection: "row" as const,
        paddingVertical: 3,
        paddingHorizontal: 6,
    },
    colOrder: { width: 30, fontSize: 8 },
    colTitle: { flex: 1, fontSize: 8 },
    colHeaderText: {
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        color: COLORS.muted,
        textTransform: "uppercase" as const,
    },

    // Footer
    footer: {
        position: "absolute" as const,
        bottom: 25,
        left: 40,
        right: 40,
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 6,
    },
    footerText: {
        fontSize: 7,
        color: COLORS.muted,
    },

    // Divider
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        marginVertical: 6,
    },

    noSessions: {
        fontSize: 9,
        color: COLORS.muted,
        fontStyle: "italic" as const,
        marginLeft: 10,
        marginBottom: 6,
    },
});

function formatTime(iso: string) {
    try {
        const d = new Date(iso);
        return d.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    } catch {
        return iso;
    }
}

function formatDate(dateStr: string) {
    try {
        const d = new Date(dateStr + "T00:00:00");
        return d.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    } catch {
        return dateStr;
    }
}

function getModeBadgeStyle(mode: string) {
    switch (mode) {
        case "online":
            return styles.modeBadgeOnline;
        case "hybrid":
            return styles.modeBadgeHybrid;
        default:
            return styles.modeBadgeOffline;
    }
}

// ---- Components ----

function SessionCard({ session }: { session: ScheduleExport["days"][0]["tracks"][0]["sessions"][0] }) {
    const hasPresentations = session.presentations && session.presentations.length > 0;

    return (
        <View style={styles.sessionCard} wrap={false}>
            {/* Header: Title + Badges */}
            <View style={styles.sessionHeader}>
                <Text style={styles.sessionTitle}>{session.title}</Text>
                <View style={styles.badgeRow}>
                    <Text style={[styles.badge, styles.typeBadge]}>
                        {session.session_type}
                    </Text>
                    <Text style={[styles.badge, getModeBadgeStyle(session.mode)]}>
                        {session.mode}
                    </Text>
                </View>
            </View>

            {/* Time */}
            <Text style={styles.sessionTime}>
                🕐  {formatTime(session.start_time)} – {formatTime(session.end_time)}
            </Text>

            {/* Venue / Room (offline/hybrid) */}
            {session.venue && (
                <Text style={styles.sessionDetail}>
                    <Text style={styles.detailLabel}>Venue: </Text>
                    {session.venue}
                    {session.room ? ` • Room: ${session.room}` : ""}
                </Text>
            )}

            {/* Platform / Meeting Link (online/hybrid) */}
            {session.meeting_link && (
                <Text style={styles.sessionDetail}>
                    <Text style={styles.detailLabel}>
                        {session.platform ? `${session.platform}: ` : "Meeting Link: "}
                    </Text>
                    <Link src={session.meeting_link}>
                        {session.meeting_link}
                    </Link>
                </Text>
            )}

            {/* Leadership */}
            {(session.chairperson_name || session.coordinator_name) && (
                <View style={styles.divider} />
            )}
            {session.chairperson_name && (
                <Text style={styles.sessionDetail}>
                    <Text style={styles.detailLabel}>Chairperson: </Text>
                    {session.chairperson_name}
                    {session.chairperson_email ? ` (${session.chairperson_email})` : ""}
                </Text>
            )}
            {session.coordinator_name && (
                <Text style={styles.sessionDetail}>
                    <Text style={styles.detailLabel}>Coordinator: </Text>
                    {session.coordinator_name}
                    {session.coordinator_email ? ` (${session.coordinator_email})` : ""}
                </Text>
            )}

            {/* Presentations table */}
            {hasPresentations && (
                <View style={styles.tableContainer}>
                    <View style={styles.tableHeader}>
                        <View style={styles.colOrder}>
                            <Text style={styles.colHeaderText}>#</Text>
                        </View>
                        <View style={styles.colTitle}>
                            <Text style={styles.colHeaderText}>Paper Title</Text>
                        </View>
                    </View>
                    {session.presentations.map((p, i) => (
                        <View
                            key={i}
                            style={
                                i === session.presentations.length - 1
                                    ? styles.tableRowLast
                                    : styles.tableRow
                            }
                        >
                            <View style={styles.colOrder}>
                                <Text>{p.presentation_order}</Text>
                            </View>
                            <View style={styles.colTitle}>
                                <Text>{p.paper_title}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

function ScheduleDocument({ data }: { data: ScheduleExport }) {
    return (
        <Document
            title={`${data.conference_name} — Schedule`}
            author="AcadFlow"
            subject="Conference Schedule"
        >
            <Page size="A4" style={styles.page}>
                {/* Cover Section */}
                <View style={styles.coverSection}>
                    <Text style={styles.conferenceTitle}>
                        {data.conference_name}
                    </Text>
                    <Text style={styles.coverMeta}>
                        Conference Schedule • {data.days.length} Day(s)
                    </Text>
                    {data.days.length > 0 && (
                        <Text style={styles.coverMeta}>
                            {formatDate(data.days[0].date)}
                            {data.days.length > 1
                                ? ` — ${formatDate(data.days[data.days.length - 1].date)}`
                                : ""}
                        </Text>
                    )}
                    <Text style={styles.coverMeta}>
                        Generated on {new Date(data.exported_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </Text>
                </View>

                {/* Days */}
                {data.days.map((day, dayIdx) => (
                    <View key={dayIdx}>
                        {/* Day header */}
                        <View style={styles.dayHeader}>
                            <Text style={styles.dayHeaderText}>
                                DAY {day.day_number}
                                {day.label ? ` — ${day.label}` : ""}
                            </Text>
                            <Text style={styles.dayDateText}>
                                {formatDate(day.date)}
                            </Text>
                        </View>

                        {/* Tracks */}
                        {day.tracks.map((track, trackIdx) => (
                            <View key={trackIdx}>
                                <View style={styles.trackHeader}>
                                    <Text style={styles.trackName}>
                                        {track.name}
                                    </Text>
                                    {track.name && (
                                        <Text style={styles.trackRoom}>
                                            {/* Room from track color_code is just a color; room info is in sessions */}
                                        </Text>
                                    )}
                                </View>

                                {/* Sessions */}
                                {track.sessions.length === 0 ? (
                                    <Text style={styles.noSessions}>
                                        No sessions scheduled in this track.
                                    </Text>
                                ) : (
                                    track.sessions.map((session, sIdx) => (
                                        <SessionCard key={sIdx} session={session} />
                                    ))
                                )}
                            </View>
                        ))}
                    </View>
                ))}

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>
                        Generated by AcadFlow
                    </Text>
                    <Text
                        style={styles.footerText}
                        render={({ pageNumber, totalPages }) =>
                            `Page ${pageNumber} of ${totalPages}`
                        }
                    />
                </View>
            </Page>
        </Document>
    );
}

// ---- Public API ----

export async function generateSchedulePDF(
    data: ScheduleExport
): Promise<Buffer> {
    const buffer = await renderToBuffer(
        <ScheduleDocument data={data} />
    );
    return Buffer.from(buffer);
}
