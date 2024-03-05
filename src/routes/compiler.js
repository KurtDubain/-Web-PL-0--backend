// 编译器管理
const Router = require("koa-router");
const compilerController = require("../controllers/compilerController");

const router = new Router();

// 编译处理
router.post("/compile", compilerController.compileCode);
// 执行处理
router.post("/compile/run", compilerController.runCode);

module.exports = router;
