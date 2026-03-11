/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2875301295")

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "bool989355118",
    "name": "completed",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "date1718663312",
    "max": "",
    "min": "",
    "name": "completedAt",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2875301295")

  // remove field
  collection.fields.removeById("bool989355118")

  // remove field
  collection.fields.removeById("date1718663312")

  return app.save(collection)
})
