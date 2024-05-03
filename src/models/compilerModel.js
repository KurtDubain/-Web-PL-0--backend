const intermediateCodeGenerator = require("../utils/intermediateCodeGeneration");
const lexicalAnalyzer = require("../utils/lexicalAnalysis");
const semanticAnalyzer = require("../utils/semanticAnalysis");
const syntaxAnalyzer = require("../utils/syntaxAnalysis");
const targetCodeGenerator = require("../utils/targetCodeGeneration");
const generateTargetCode = require("../utils/targetCodeGeneration");
const jsGenterator = require("../utils/targetCodeJs");
const wabt = require("wabt");
// 编译操作数据模型
const compilerModel = {
  // 编译功能
  async compileCode(code, options, language) {
    const result = {};
    // 根据options确定返回的result内容
    // Lexical analysis词法分析
    if (options["LexicalAnalysis"]) {
      result["LexicalAnalysis"] = await this.performLexicalAnalysis(code);
    }

    // Syntax analysis语法分析
    if (options["SyntaxAnalysis"]) {
      result["SyntaxAnalysis"] = await this.performSyntaxAnalysis(code);
    }

    // Semantic analysis语义分析
    if (options["SemanticAnalysis"]) {
      result["SemanticAnalysis"] = await this.performSemanticAnalysis(code);
    }

    // Intermediate code generation中间代码生成
    if (options["IntermediateCodeGeneration"]) {
      result["IntermediateCodeGeneration"] =
        await this.performIntermediateCodeGeneration(code);
      // console.log(
      //   jsGenterator.generateJS(result["IntermediateCodeGeneration"])
      // );
    }
    // Target code generation目标代码生成
    if (options["TargetCodeGeneration"]) {
      if (language == "js") {
        result["TargetCodeGeneration"] =
          await this.performTargetJSCodeGeneration(code);
      } else if (language == "wasm") {
        result["TargetCodeGeneration"] = await this.performTargetCodeGeneration(
          code
        );
      }
    }
    return result;
  },
  // 编译步骤实现
  // 词法分析实现
  async performLexicalAnalysis(code) {
    const token = lexicalAnalyzer.analyze(code);
    return token;
  },
  // 语法分析实现
  async performSyntaxAnalysis(code) {
    // 将 PL/0 代码解析成 token 数组
    const tokens = await this.performLexicalAnalysis(code);
    try {
      // 使用语法分析器进行语法分析
      return syntaxAnalyzer.analyze(tokens);
    } catch (error) {
      console.error(`语法分析出错了: ${error.message}`);
      return `语法分析错误: ${error.message}`;
    }
  },
  // 语义分析实现
  async performSemanticAnalysis(code) {
    const ast = await this.performSyntaxAnalysis(code);
    try {
      // 使用语法分析器进行语法分析
      return semanticAnalyzer.analyze(ast);
      // return semanticAnalyzer.analysisResult;
    } catch (error) {
      console.error(`语义分析出错了: ${error.message}`);
      return `语义分析错误: ${error.message}`;
    }
  },
  // 中间代码生成实现
  async performIntermediateCodeGeneration(code) {
    try {
      const syntaxTree = await this.performSyntaxAnalysis(code);
      const intermediateCode =
        intermediateCodeGenerator.generateIntermediateCode(syntaxTree);
      // console.log(intermediateCode === []);
      // console.log(syntaxTree);
      console.log(intermediateCode.length == 0 ? syntaxTree : intermediateCode);
      return intermediateCode.length == 0 ? syntaxTree : intermediateCode;
    } catch (error) {
      console.error(`中间代码生成出错了: ${error.message}`);
      return `中间代码生成错误: ${error.message}`;
    }
  },

  // 目标代码生成实现
  async performTargetCodeGeneration(code) {
    try {
      const intermediateCode = await this.performIntermediateCodeGeneration(
        code
      );
      const targetCode = generateTargetCode.generateWAT(intermediateCode);
      return intermediateCode.length == 0
        ? "目标代码生成异常，请排查语法错误"
        : targetCode;
    } catch (error) {
      console.error(`目标代码生成出错了: ${error.message}`);
      return `目标代码生成错误: ${error.message}`;
    }
  },
  async performTargetJSCodeGeneration(code) {
    try {
      const ast = await this.performSyntaxAnalysis(code);
      const intermediateCode =
        intermediateCodeGenerator.generateIntermediateCodeWithLine(ast);
      const targetCode = jsGenterator.generateJS(intermediateCode);
      return intermediateCode.length == 0
        ? "目标代码生成异常，请排查语法错误"
        : targetCode;
    } catch (error) {
      console.error(`目标代码生成出错了: ${error.message}`);
      return `目标代码生成错误: ${error.message}`;
    }
  },
  // WAT转换成WASM处理，用于执行
  async runCode(wat) {
    try {
      const wabtModule = await wabt();
      const wasmModule = wabtModule.parseWat("example.wat", wat);
      const { buffer } = wasmModule.toBinary({});
      return buffer;
    } catch (error) {
      console.error("wat change wasm fail", error);
      return null;
    }
  },
};

module.exports = compilerModel;
