// 调试器路由
const Router = require("koa-router");
const debuggerController = require("../controllers/debuggerController");

const router = new Router();

// 调试到指定断点
router.post("/debug2point", debuggerController.debug2point);
// 单点执行
router.post("/continueOne", debuggerController.debugNextPoint);
// 调试器初始化变量
router.post("/init", debuggerController.init);

module.exports = router;
