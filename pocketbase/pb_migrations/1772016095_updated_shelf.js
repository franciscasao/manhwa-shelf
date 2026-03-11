/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1845617928")

  // remove field
  collection.fields.removeById("text3740358174")

  // add field
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
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1845617928")

  // add field
  collection.fields.addAt(8, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3740358174",
    "max": 0,
    "min": 0,
    "name": "origin",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // remove field
  collection.fields.removeById("select3740358174")

  return app.save(collection)
})
