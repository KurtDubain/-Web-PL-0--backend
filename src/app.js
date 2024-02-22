// src/app.js
const Koa = require("koa");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const cors = require("koa-cors");
const compilerRoutes = require("./routes/compiler");

const app = new Koa();
const router = new Router();

// Middleware
app.use(cors());
app.use(bodyParser());

router.use("/compiler", compilerRoutes.routes());
// Use the routes defined by the router
app.use(router.routes());
app.use(router.allowedMethods());

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
