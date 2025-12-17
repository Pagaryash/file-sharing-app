const router = require("express").Router();
const auth = require("../middlewares/auth");

router.get("/me", auth, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user,
  });
});

module.exports = router;
