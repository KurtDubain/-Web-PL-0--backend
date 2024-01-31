// src/controllers/complierController.js
const compilerModel = require('../models/compilerModel');

const compilerController = {
  async compileCode(ctx) {
    const { code } = ctx.request.body;

    // 调用编译器的功能
    const compiledResult = await compilerModel.compileCode(code);

    ctx.body = {
      result: compiledResult,
    };
  },
};

module.exports = compilerController;
