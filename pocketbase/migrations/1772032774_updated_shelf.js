/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1845617928")

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "select3740358174",
    "maxSelect": 1,
    "name": "origin",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "KR",
      "JP",
      "CN",
      "TW"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1845617928")

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "select3740358174",
    "maxSelect": 1,
    "name": "origin",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "KR",
      "JP"
    ]
  }))

  return app.save(collection)
})
