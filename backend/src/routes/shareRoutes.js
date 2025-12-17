const router = require("express").Router();
const {
  accessViaShareLinkPublic,
  downloadViaShareLinkPublic,
} = require("../controllers/fileController");

router.get("/:token", accessViaShareLinkPublic);

router.get("/:token/download", downloadViaShareLinkPublic);

module.exports = router;
