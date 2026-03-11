/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2875301295");

  return app.delete(collection);
}, (app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != '' && @request.auth.verified = true",
    "deleteRule": "@request.auth.id != '' && @request.auth.verified = true",
    "fields": [
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text371709992",
        "max": 0,
        "min": 0,
        "name": "mangaId",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number3587206102",
        "max": null,
        "min": null,
        "name": "chapterNum",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number2605917380",
        "max": null,
        "min": null,
        "name": "pageIndex",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number3263703447",
        "max": null,
        "min": null,
        "name": "totalPages",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3901148734",
        "max": 0,
        "min": 0,
        "name": "mangaTitle",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1829049001",
        "max": 0,
        "min": 0,
        "name": "coverImage",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate3332085495",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      }
    ],
    "id": "pbc_2875301295",
    "indexes": [
      "CREATE UNIQUE INDEX idx_readingHistory_manga_chapter ON readingHistory (mangaId, chapterNum)",
      "CREATE INDEX idx_readingHistory_mangaId ON readingHistory (mangaId)"
    ],
    "listRule": "@request.auth.id != '' && @request.auth.verified = true",
    "name": "readingHistory",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != '' && @request.auth.verified = true",
    "viewRule": "@request.auth.id != '' && @request.auth.verified = true"
  });

  return app.save(collection);
})
