/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2798257259")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != '' && @request.auth.verified = true",
    "deleteRule": "@request.auth.id != '' && @request.auth.verified = true",
    "listRule": "@request.auth.id != '' && @request.auth.verified = true",
    "updateRule": "@request.auth.id != '' && @request.auth.verified = true",
    "viewRule": "@request.auth.id != '' && @request.auth.verified = true"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2798257259")

  // update collection data
  unmarshal({
    "createRule": "",
    "deleteRule": "",
    "listRule": "",
    "updateRule": "",
    "viewRule": ""
  }, collection)

  return app.save(collection)
})
