/// <reference path="../pb_data/types.d.ts" />

// Sends an email to the admin when a new user registers.
//
// Requires:
//   - SMTP configured in PocketBase admin → Settings → Mail settings
//   - ADMIN_NOTIFY_EMAIL env var set to the address that should receive alerts
//
// The PocketBase process must be started with the env var in scope, e.g.:
//   ADMIN_NOTIFY_EMAIL=you@example.com ./pocketbase serve

onRecordAfterCreateSuccess((e) => {
    const adminEmail = $os.getenv("ADMIN_NOTIFY_EMAIL")
    if (!adminEmail) {
        return
    }

    const newUserEmail = e.record.get("email")
    const pbUrl = $app.settings().meta.appUrl || "your PocketBase admin URL"

    try {
        const message = new MailerMessage()
        message.setFrom({
            address: $app.settings().meta.senderAddress,
            name: $app.settings().meta.senderName || "Manhwa Shelf",
        })
        message.addTo({ address: adminEmail })
        message.setSubject("New user registration: " + newUserEmail)
        message.setHtml(
            "<p>A new user has registered on Manhwa Shelf and is awaiting verification.</p>" +
            "<p><strong>Email:</strong> " + newUserEmail + "</p>" +
            "<p><strong>Registered at:</strong> " + new Date().toUTCString() + "</p>" +
            "<p>Visit <a href=\"" + pbUrl + "/_/#/collections?collectionId=_pb_users_auth_\">" +
            "PocketBase admin</a> to verify or reject this account.</p>"
        )

        $app.newMailClient().send(message)
    } catch (err) {
        console.error("notify_admin: failed to send registration email:", err)
    }
}, "users")
