// Back-End/ImportSheet/importRoutes.js
const express = require("express");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const controller = require("./importController");

const router = express.Router();

router.get("/template", controller.downloadTemplate);
router.post("/preview", upload.single("file"), controller.preview);
router.post("/confirm", express.json(), controller.confirm);

module.exports = router;
