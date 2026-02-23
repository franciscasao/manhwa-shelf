"use client";

import { sampleManga } from "@/data/sample";
import { Manga, DownloadStatus } from "@/lib/types";
import { JetBrains_Mono } from "next/font/google";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
});

function getDownloadStatus(manga: Manga): DownloadStatus {
  if (manga.chapters.downloaded === 0) return "not-downloaded";
  if (
    manga.chapters.total &&
    manga.chapters.downloaded >= manga.chapters.total
  )
    return "complete";
  return "partial";
}

function ProgressBar({ manga }: { manga: Manga }) {
  const status = getDownloadStatus(manga);

  if (status === "not-downloaded") {
    return (
      <span style={{ color: "#555" }}>
        {"["}{"░░░░░░░░░░"}{"]"} {"  0%"}
      </span>
    );
  }

  if (status === "complete") {
    return (
      <span style={{ color: "#00ff9f" }}>
        {"["}{"██████████"}{"]"} {"100%"}
      </span>
    );
  }

  // partial
  const total = manga.chapters.total ?? manga.chapters.downloaded;
  const pct = total > 0 ? Math.round((manga.chapters.downloaded / total) * 100) : 0;
  const filled = Math.round(pct / 10);
  const empty = 10 - filled;
  return (
    <span style={{ color: "#00d4ff" }}>
      {"["}
      <span style={{ color: "#00ff9f" }}>{"█".repeat(filled)}</span>
      <span style={{ color: "#333" }}>{"░".repeat(empty)}</span>
      {"]"} {pct.toString().padStart(3, " ")}%
    </span>
  );
}

function StatusBadge({ status }: { status: DownloadStatus }) {
  const map: Record<DownloadStatus, { label: string; color: string }> = {
    complete: { label: "DONE", color: "#00ff9f" },
    partial: { label: "SYNC", color: "#00d4ff" },
    queued: { label: "WAIT", color: "#ffaa00" },
    "not-downloaded": { label: "NONE", color: "#555" },
  };
  const { label, color } = map[status];
  return (
    <span
      style={{
        color,
        border: `1px solid ${color}`,
        padding: "1px 6px",
        fontSize: "0.7rem",
        letterSpacing: "0.05em",
      }}
    >
      {label}
    </span>
  );
}

export default function Option3Page() {
  const totalTitles = sampleManga.length;
  const totalChapters = sampleManga.reduce(
    (sum, m) => sum + m.chapters.downloaded,
    0
  );
  const totalSizeGB = sampleManga.reduce((sum, m) => {
    const match = m.sizeOnDisk.match(/([\d.]+)\s*(GB|MB)/i);
    if (!match) return sum;
    const val = parseFloat(match[1]);
    return sum + (match[2].toUpperCase() === "GB" ? val : val / 1024);
  }, 0);

  const columns = [
    { key: "status", label: "STATUS", hideOnMobile: false },
    { key: "title", label: "TITLE", hideOnMobile: false },
    { key: "author", label: "AUTHOR", hideOnMobile: true },
    { key: "progress", label: "PROGRESS", hideOnMobile: false },
    { key: "chapters", label: "CHS", hideOnMobile: false },
    { key: "size", label: "SIZE", hideOnMobile: false },
    { key: "lastSync", label: "LAST SYNC", hideOnMobile: true },
  ];

  return (
    <div
      className={jetbrainsMono.className}
      style={{
        background: "#0a0a0f",
        color: "#00ff9f",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* CRT scan-line overlay */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 50,
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)",
        }}
      />

      {/* Blinking cursor keyframes */}
      <style>{`
        @keyframes blink-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .blink-cursor {
          animation: blink-cursor 1s step-end infinite;
        }
        @keyframes flicker {
          0% { opacity: 0.97; }
          5% { opacity: 0.95; }
          10% { opacity: 0.98; }
          15% { opacity: 0.96; }
          20% { opacity: 0.99; }
          50% { opacity: 0.96; }
          80% { opacity: 0.98; }
          100% { opacity: 0.97; }
        }
      `}</style>

      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: "1200px",
          margin: "0 auto",
          animation: "flicker 4s infinite",
        }}
        className="px-3 py-6 md:px-8 md:py-10"
      >
        {/* Header */}
        <div
          style={{ color: "#00ff9f", borderBottom: "1px solid #1a3a2a" }}
          className="pb-4 mb-6"
        >
          <pre
            style={{ color: "#00ff9f", fontSize: "0.65rem", lineHeight: 1.3 }}
            className="hidden md:block mb-4 select-none"
          >
{`
 ███╗   ███╗ █████╗ ███╗   ██╗██╗  ██╗██╗    ██╗ █████╗       ███████╗██╗  ██╗███████╗██╗     ███████╗
 ████╗ ████║██╔══██╗████╗  ██║██║  ██║██║    ██║██╔══██╗      ██╔════╝██║  ██║██╔════╝██║     ██╔════╝
 ██╔████╔██║███████║██╔██╗ ██║███████║██║ █╗ ██║███████║█████╗███████╗███████║█████╗  ██║     █████╗
 ██║╚██╔╝██║██╔══██║██║╚██╗██║██╔══██║██║███╗██║██╔══██║╚════╝╚════██║██╔══██║██╔══╝  ██║     ██╔══╝
 ██║ ╚═╝ ██║██║  ██║██║ ╚████║██║  ██║╚███╔███╔╝██║  ██║      ███████║██║  ██║███████╗███████╗██║
 ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝      ╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚═╝`}
          </pre>
          <div className="md:hidden mb-3" style={{ fontSize: "1rem", fontWeight: 700 }}>
            {">"} MANHWA-SHELF v2.0
          </div>

          {/* Stats banner */}
          <div
            style={{
              color: "#00d4ff",
              border: "1px solid #1a3a3a",
              background: "rgba(0, 212, 255, 0.03)",
            }}
            className="px-3 py-2 md:px-5 md:py-3 text-xs md:text-sm"
          >
            <span style={{ color: "#555" }}>{"["}</span>
            <span style={{ color: "#00ff9f" }}>SYS</span>
            <span style={{ color: "#555" }}>{"]"}</span>
            {" "}TOTAL:{" "}
            <span style={{ color: "#fff" }}>{totalTitles}</span> TITLES{" "}
            <span style={{ color: "#333" }}>|</span>{" "}
            <span style={{ color: "#fff" }}>
              {totalChapters.toLocaleString()}
            </span>{" "}
            CHS{" "}
            <span style={{ color: "#333" }}>|</span>{" "}
            <span style={{ color: "#fff" }}>{totalSizeGB.toFixed(1)}</span> GB
            <span className="blink-cursor" style={{ color: "#00ff9f" }}>
              _
            </span>
          </div>
        </div>

        {/* Boot sequence text */}
        <div
          className="mb-4 text-xs"
          style={{ color: "#333" }}
        >
          <div>{">"} initializing download manager...</div>
          <div>{">"} scanning local archive...</div>
          <div>
            {">"} found {totalTitles} titles ({totalChapters.toLocaleString()}{" "}
            chapters indexed)
          </div>
          <div style={{ color: "#00ff9f" }}>{">"} ready.</div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.8rem",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid #1a3a2a",
                  color: "#00d4ff",
                  textAlign: "left",
                }}
              >
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`py-2 px-2 md:px-3 cursor-pointer select-none ${
                      col.hideOnMobile ? "hidden md:table-cell" : ""
                    }`}
                    style={{
                      fontWeight: 700,
                      fontSize: "0.7rem",
                      letterSpacing: "0.1em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col.label}{" "}
                    <span style={{ color: "#333", fontSize: "0.6rem" }}>
                      {"▲▼"}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sampleManga.map((manga) => {
                const status = getDownloadStatus(manga);
                const isPartial = status === "partial";
                const chaptersStr = manga.chapters.total
                  ? `${manga.chapters.downloaded}/${manga.chapters.total}`
                  : `${manga.chapters.downloaded}/?`;

                return (
                  <tr
                    key={manga.id}
                    style={{
                      borderBottom: "1px solid #111118",
                      transition: "background 0.15s",
                    }}
                    className="hover:bg-[#111120] group"
                  >
                    {/* STATUS */}
                    <td className="py-2 px-2 md:px-3">
                      <StatusBadge status={status} />
                    </td>

                    {/* TITLE */}
                    <td
                      className="py-2 px-2 md:px-3"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {/* Cover thumbnail */}
                        <div
                          style={{
                            width: "28px",
                            height: "38px",
                            flexShrink: 0,
                            border: `1px solid ${
                              status === "complete"
                                ? "#00ff9f"
                                : status === "partial"
                                ? "#00d4ff"
                                : "#333"
                            }`,
                            overflow: "hidden",
                            position: "relative",
                            background: "#111",
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={manga.coverImage}
                            alt={manga.title}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              opacity: status === "not-downloaded" ? 0.3 : 0.85,
                              filter: "saturate(0.6) contrast(1.2)",
                            }}
                          />
                          {/* Scanline overlay on thumbnail */}
                          <div
                            aria-hidden="true"
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              background:
                                "repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0px, rgba(0,0,0,0.25) 1px, transparent 1px, transparent 2px)",
                              pointerEvents: "none",
                            }}
                          />
                        </div>
                        <div>
                          <span style={{ color: "#555" }}>{">"} </span>
                          <span
                            style={{
                              color:
                                status === "complete"
                                  ? "#00ff9f"
                                  : status === "partial"
                                  ? "#00d4ff"
                                  : "#666",
                            }}
                          >
                            {manga.title}
                          </span>
                          {isPartial && (
                            <span
                              className="blink-cursor"
                              style={{ color: "#00d4ff" }}
                            >
                              _
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* AUTHOR */}
                    <td
                      className="py-2 px-2 md:px-3 hidden md:table-cell"
                      style={{ color: "#555", whiteSpace: "nowrap" }}
                    >
                      {manga.author}
                    </td>

                    {/* PROGRESS */}
                    <td
                      className="py-2 px-2 md:px-3"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      <ProgressBar manga={manga} />
                    </td>

                    {/* CHAPTERS */}
                    <td
                      className="py-2 px-2 md:px-3"
                      style={{
                        color: "#888",
                        whiteSpace: "nowrap",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {chaptersStr}
                    </td>

                    {/* SIZE */}
                    <td
                      className="py-2 px-2 md:px-3"
                      style={{
                        color:
                          manga.sizeOnDisk === "0 MB" ? "#333" : "#00d4ff",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {manga.sizeOnDisk}
                    </td>

                    {/* LAST SYNC */}
                    <td
                      className="py-2 px-2 md:px-3 hidden md:table-cell"
                      style={{
                        color: "#444",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {manga.lastUpdated || "--"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          className="mt-6 pt-4 text-xs"
          style={{ borderTop: "1px solid #1a3a2a", color: "#333" }}
        >
          <div className="flex flex-col md:flex-row md:justify-between gap-1">
            <span>
              <span style={{ color: "#555" }}>{"["}</span>
              <span style={{ color: "#00ff9f" }}>OK</span>
              <span style={{ color: "#555" }}>{"]"}</span>
              {" "}manhwa-shelf daemon running on port 9090
            </span>
            <span>
              session: 0x4f2a
              <span style={{ color: "#333" }}> | </span>
              uptime: 14d 7h 23m
              <span style={{ color: "#333" }}> | </span>
              <span style={{ color: "#00ff9f" }}>
                connected
                <span className="blink-cursor">_</span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
