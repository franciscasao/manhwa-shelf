/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1845617928")

  // add avgChapterSize text field
  collection.fields.add(new Field({
    "hidden": false,
    "id": "text_avgChapterSize",
    "name": "avgChapterSize",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  app.save(collection)

  // backfill avgChapterSize for existing shelf records with downloads
  const shelfRecords = app.findAllRecords("shelf")

  for (const record of shelfRecords) {
    const chapters = record.get("chapters")
    if (!chapters || chapters.downloaded === 0) {
      continue
    }

    let downloads
    try {
      downloads = app.findRecordsByFilter(
        "chapterDownloads",
        `mangaId = "${record.id}"`,
        "",
        0,
        0
      )
    } catch {
      continue
    }

    if (!downloads || downloads.length === 0) {
      continue
    }

    let totalBytes = 0
    for (const dl of downloads) {
      totalBytes += dl.get("sizeBytes") || 0
    }

    const avgBytes = totalBytes / downloads.length
    let formatted
    if (avgBytes >= 1024 * 1024 * 1024) {
      formatted = (avgBytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"
    } else {
      formatted = (avgBytes / (1024 * 1024)).toFixed(2) + " MB"
    }

    record.set("avgChapterSize", formatted)
    app.save(record)
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1845617928")

  // remove avgChapterSize field
  collection.fields.removeByName("avgChapterSize")

  app.save(collection)
})
