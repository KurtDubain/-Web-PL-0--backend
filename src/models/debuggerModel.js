// 调试器数据模型
const Debugger = require("../utils/debuggerUtils");
const intermediateCodeGenerator = require("../utils/intermediateCodeGeneration");
const lexicalAnalyzer = require("../utils/lexicalAnalysis");
const semanticAnalyzer = require("../utils/semanticAnalysis");
const syntaxAnalyzer = require("../utils/syntaxAnalysis");
const myDebugger = new Debugger();
const debuggerModel = {
  // 调试到指定点
  async debug2point(code, line) {
    try {
      // 获取携带行数信息的中间代码
      const token = lexicalAnalyzer.analyze(code);
      const ast = syntaxAnalyzer.analyze(token);
      const interCodeWithLine =
        intermediateCodeGenerator.generateIntermediateCodeWithLine(ast);
      // 初始化中间代码信息
      myDebugger.loadDebugInfo(line, interCodeWithLine);
      // 执行中间代码到断点
      myDebugger.getVariableStatesAtLine(line);
      // 返回当前符号表
      return myDebugger.getVariablesInitValues();
    } catch (error) {
      console.error("get symbolTable false", error);
    }
  },
  // 初始化变量
  async init(code, line) {
    try {
      // 获取符号表初始化信息
      const token = lexicalAnalyzer.analyze(code);
      const ast = syntaxAnalyzer.analyze(token);
      const symbolTable = semanticAnalyzer.analyze(ast);
      myDebugger.loadSymbolTable(symbolTable);
      // 解析符号表并序列化
      const initResult = myDebugger.getVariablesInitValues();
      return initResult;
    } catch (error) {
      console.error("init symbolTable fail", error);
    }
  },
};
module.exports = debuggerModel;
