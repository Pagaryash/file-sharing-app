const router = require("express").Router();
const auth = require("../middlewares/auth");
const upload = require("../middlewares/upload");
const {
  uploadSingle,
  uploadBulk,
  listMyFiles,
  shareWithUsers,
  listSharedWithMe,
  getFileMeta,
  downloadFile,
  createShareLink,
  createDownloadTicket,
  downloadWithTicket,
} = require("../controllers/fileController");

router.get("/mine", auth, listMyFiles);
router.get("/shared-with-me", auth, listSharedWithMe);

router.post("/upload", auth, upload.single("file"), uploadSingle);
router.post("/upload/bulk", auth, upload.array("files", 10), uploadBulk);

router.post("/:fileId/share", auth, shareWithUsers);
router.post("/:fileId/share-link", auth, createShareLink);

router.post("/:fileId/download-ticket", auth, createDownloadTicket);
router.get("/download/:ticket", downloadWithTicket);

router.get("/:fileId", auth, getFileMeta);
router.get("/:fileId/download", auth, downloadFile);

module.exports = router;
