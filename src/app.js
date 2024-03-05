// src/app.js
const Koa = require("koa");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const cors = require("koa-cors");
// 路由文件引入
const compilerRoutes = require("./routes/compiler");
const debuggerRoutes = require("./routes/debugger");

const app = new Koa();
const router = new Router();

// 中间件
app.use(cors());
app.use(bodyParser());
// 路由
router.use("/compiler", compilerRoutes.routes());
router.use("/debugger", debuggerRoutes.routes());
// 初始化
app.use(router.routes());
app.use(router.allowedMethods());

// 服务启动
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
