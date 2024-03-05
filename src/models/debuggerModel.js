const Debugger = require("../utils/debuggerUtils");
const intermediateCodeGenerator = require("../utils/intermediateCodeGeneration");
const lexicalAnalyzer = require("../utils/lexicalAnalysis");
const semanticAnalyzer = require("../utils/semanticAnalysis");
const syntaxAnalyzer = require("../utils/syntaxAnalysis");
const myDebugger = new Debugger();
const debuggerModel = {
  async debug2point(code, line) {
    try {
      const token = lexicalAnalyzer.analyze(code);
      const ast = syntaxAnalyzer.analyze(token);
      const interCodeWithLine =
        intermediateCodeGenerator.generateIntermediateCodeWithLine(ast);
      return interCodeWithLine;
    } catch (error) {}
  },
  async init(code, line) {
    try {
      const token = lexicalAnalyzer.analyze(code);
      const ast = syntaxAnalyzer.analyze(token);
      const symbolTable = semanticAnalyzer.analyze(ast);
      myDebugger.loadSymbolTable(symbolTable);
      const initResult = myDebugger.getVariablesInitValues();
      return initResult;
    } catch (error) {
      console.error("init symbolTable fail", error);
    }
  },
};
module.exports = debuggerModel;
