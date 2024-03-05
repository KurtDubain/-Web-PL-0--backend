const debuggerModel = require("../models/debuggerModel");
const debuggerController = {
  async debug2point(ctx) {
    try {
      const { data } = ctx.request.body;
      const pointResult = await debuggerModel.debug2point(data);
      ctx.status = 200;
      ctx.body = {
        success: true,
        message: "成功执行到断点位置",
        result: pointResult,
      };
    } catch (error) {
      console.error("执行到断点位置异常", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "执行到断点位置异常",
        error: error.message,
      };
    }
  },
  async debugNextPoint(ctx) {
    try {
      const { data } = ctx.request.body;
      const nextPointResult = await debuggerModel.debug2point(data);
      ctx.status = 200;
      ctx.body = {
        success: true,
        message: "单步执行成功",
        result: nextPointResult,
      };
    } catch (error) {
      console.error("单步执行异常", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "单步执行异常",
        error: error.message,
      };
    }
  },
  async init(ctx) {
    try {
      const { data } = ctx.request.body;
      const initResult = await debuggerModel.init(data.code.content, data.line);
      ctx.status = 200;
      ctx.body = {
        success: true,
        message: "初始化变量（常量）值成功",
        result: initResult,
      };
    } catch (error) {
      console.error("初始化变量（常量）值失败", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "初始化变量（常量）值失败",
        error: error.message,
      };
    }
  },
};
module.exports = debuggerController;
