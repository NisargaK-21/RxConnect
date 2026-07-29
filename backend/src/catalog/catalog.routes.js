const express = require("express");
const router = express.Router();

const { fetchCatalog } = require("./catalog.controller");

router.get("/", fetchCatalog);

module.exports = router;