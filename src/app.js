// src/app.js
const Koa = require("koa");
const http = require("http");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const cors = require("koa-cors");
const startWebSocketServer = require("./services/webSocketServer");
// 路由文件引入
const compilerRoutes = require("./routes/compiler");
const debuggerRoutes = require("./routes/debugger");

const app = new Koa();
const router = new Router();

// 中间件（跨域和POST请求体解析）
app.use(cors());
app.use(bodyParser());
// 路由
router.use("/compiler", compilerRoutes.routes());
router.use("/debugger", debuggerRoutes.routes());
// 初始化
app.use(router.routes());
app.use(router.allowedMethods());

const server = http.createServer(app.callback());

startWebSocketServer(server);
// 服务启动
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log("毕设启动！");
});
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
