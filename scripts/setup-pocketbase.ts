import PocketBase from "pocketbase";

async function main() {
  const url = process.env.NEXT_PUBLIC_POCKETBASE_URL ?? "http://127.0.0.1:8090";
  const email = process.env.PB_ADMIN_EMAIL;
  const password = process.env.PB_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "Missing PB_ADMIN_EMAIL or PB_ADMIN_PASSWORD environment variables.",
    );
    process.exit(1);
  }

  const pb = new PocketBase(url);

  console.log(`Connecting to PocketBase at ${url}...`);
  try {
    await pb.collection("_superusers").authWithPassword(email, password);
  } catch (err) {
    console.error("Failed to authenticate:", (err as any).message ?? err);
    process.exit(1);
  }
  console.log("Authenticated as superuser.");

  const collections = [
    {
      name: "shelf",
      type: "base",
      fields: [
        { name: "title", type: "text", required: true },
        { name: "author", type: "text" },
        { name: "coverImage", type: "text" },
        { name: "genres", type: "json" },
        { name: "rating", type: "number" },
        { name: "chapters", type: "json" },
        { name: "sizeOnDisk", type: "text" },
        { name: "lastUpdated", type: "text" },
        { name: "origin", type: "text" },
      ],
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
    },
    {
      name: "chapterDownloads",
      type: "base",
      fields: [
        { name: "mangaId", type: "text", required: true },
        { name: "chapterNum", type: "number" },
        { name: "episodeTitle", type: "text" },
        { name: "cbzFile", type: "file", maxSelect: 1, maxSize: 104857600 },
        { name: "sizeBytes", type: "number" },
        { name: "downloadedAt", type: "number" },
      ],
      indexes: [
        "CREATE INDEX idx_chapterDownloads_mangaId ON chapterDownloads (mangaId)",
      ],
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
    },
    {
      name: "webtoonCache",
      type: "base",
      fields: [
        { name: "titleId", type: "text", required: true },
        { name: "type", type: "text" },
        { name: "episodes", type: "json", maxSize: 20000000 },
        { name: "fetchedAt", type: "number" },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_webtoonCache_titleId ON webtoonCache (titleId)",
      ],
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
    },
  ];

  console.log("Importing collections...");
  try {
    await pb.collections.import(collections as any, false);
  } catch (err) {
    const e = err as any;
    console.error("Import failed:", e.message ?? err);
    if (e.response)
      console.error("Response:", JSON.stringify(e.response, null, 2));
    process.exit(1);
  }
  console.log(
    `Done. ${collections.length} collections imported: ${collections.map((c) => c.name).join(", ")}`,
  );
}

main();
