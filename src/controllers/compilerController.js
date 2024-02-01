// src/controllers/complierController.js
const compilerModel = require('../models/compilerModel');

const compilerController = {
  async compileCode(ctx) {
    try{
      const { data } = ctx.request.body;
      // console.log(data)
      // 调用编译器的功能
      const compiledResult = await compilerModel.compileCode(data.code,data.options);
      ctx.status = 200
      ctx.body = {
        success:true,
        message:'编译成功',
        result: compiledResult,
      };
    }catch(error){
      console.error('编译控制器异常',error)
      ctx.status = 500
      ctx.body = {
        success:false,
        message:'编译失败',
        error:error.message
      }
    }
    
  },
};

module.exports = compilerController;
