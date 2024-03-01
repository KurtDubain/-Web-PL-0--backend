// src/routes/complier.js
const Router = require("koa-router");
const compilerController = require("../controllers/compilerController");

const router = new Router();

// Routes related to compiler
router.post("/compile", compilerController.compileCode);
router.post("/compile/run", compilerController.runCode);

module.exports = router;
