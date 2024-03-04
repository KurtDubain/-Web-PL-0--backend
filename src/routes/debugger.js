const Router = require("koa-router");
const compilerController = require("../controllers/debuggerController");

const router = new Router();

// Routes related to compiler
router.post("/continueLot", compilerController.compileCode);
router.post("/continueOne", compilerController.runCode);

module.exports = router;
