/// <reference path="../pocketbase/pb_data/types.d.ts" />

// Cron job: auto-download new chapters for shelf entries every 12 hours.
//
// PocketBase handles the scheduling via cronAdd(). The actual download
// work (source extension parsing, image optimization, upload) runs in
// the Next.js server, which is triggered via an internal HTTP call.
//
// Env vars:
//   CRON_SECRET           — shared secret for authenticating the trigger call
//   NEXT_APP_URL          — Next.js server URL (default: http://localhost:3000)
//   CRON_CHAPTER_DOWNLOAD — set to "false" to disable without removing the hook

cronAdd("autoDownloadChapters", "0 */12 * * *", () => {
    const enabled = $os.getenv("CRON_CHAPTER_DOWNLOAD")
    if (enabled === "false") {
        console.log("[cron] Chapter download cron is disabled via CRON_CHAPTER_DOWNLOAD=false")
        return
    }

    const appUrl = $os.getenv("NEXT_APP_URL") || "http://localhost:3000"
    const secret = $os.getenv("CRON_SECRET")

    if (!secret) {
        console.log("[cron] CRON_SECRET not set — skipping auto-download trigger")
        return
    }

    console.log("[cron] Triggering chapter auto-download at " + new Date().toISOString())

    try {
        const res = $http.send({
            url: appUrl + "/api/internal/cron-download",
            method: "POST",
            headers: {
                "authorization": "Bearer " + secret,
                "content-type": "application/json",
            },
            timeout: 300, // 5 minutes — downloads can take a while
        })

        if (res.statusCode >= 200 && res.statusCode < 300) {
            const body = res.json
            console.log(
                "[cron] Download job completed: " +
                (body.enqueued || 0) + " chapters enqueued across " +
                Object.keys(body.sources || {}).length + " sources"
            )
            if (body.errors && body.errors.length > 0) {
                console.log("[cron] Errors: " + JSON.stringify(body.errors))
            }
        } else {
            console.log("[cron] Trigger failed with status " + res.statusCode + ": " + JSON.stringify(res.json))
        }
    } catch (err) {
        console.error("[cron] Failed to trigger auto-download:", err)
    }
})
