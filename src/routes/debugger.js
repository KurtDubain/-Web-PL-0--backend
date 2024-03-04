const Router = require("koa-router");
const debuggerController = require("../controllers/debuggerController");

const router = new Router();

// Routes related to compiler
router.post("/continueLot", debuggerController.debug2point);
router.post("/continueOne", debuggerController.debugNextPoint);
router.post("/init", debuggerController.init);

module.exports = router;
