// 编译控制器
const compilerModel = require("../models/compilerModel");

const compilerController = {
  // 编译
  async compileCode(ctx) {
    try {
      const { data } = ctx.request.body;
      // 调用编译器的功能
      const compiledResult = await compilerModel.compileCode(
        data.code,
        data.options
      );
      ctx.status = 200;
      ctx.body = {
        success: true,
        message: "编译成功",
        result: compiledResult,
      };
    } catch (error) {
      console.error("编译控制器异常", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "编译失败",
        error: error.message,
      };
    }
  },
  // 执行功能
  async runCode(ctx) {
    try {
      const { data } = ctx.request.body;
      // 调用编译器的功能
      const compiledResult = await compilerModel.compileCode(
        data.code,
        data.options
      );
      const runResult = await compilerModel.runCode(
        compiledResult.TargetCodeGeneration
      );
      ctx.status = 200;
      ctx.body = {
        success: true,
        message: "执行成功",
        result: runResult,
      };
    } catch (error) {
      console.error("执行异常", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "执行失败",
        error: error.message,
      };
    }
  },
};

module.exports = compilerController;
