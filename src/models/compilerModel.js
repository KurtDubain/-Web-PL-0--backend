// src/models/complierModel.js
import intermediateCodeGenerator from '../utils/intermediateCodeGeneration';
import lexicalAnalyzer from '../utils/lexicalAnalysis'
import semanticAnalyzer from '../utils/semanticAnalysis';
import syntaxAnalyzer from '../utils/syntaxAnalysis';
import generateTargetCode from '../utils/targetCodeGeneration';

const compilerModel = {
    async compileCode(code, options) {
      const result = {};
  
      // Lexical analysis词法分析
      if (options['Lexical analysis']) {
        result['Lexical analysis'] = await this.performLexicalAnalysis(code);
      }
  
      // Syntax analysis语法分析
      if (options['Syntax analysis']) {
        result['Syntax analysis'] = await this.performSyntaxAnalysis(code);
      }
  
      // Semantic analysis语义分析
      if (options['Semantic analysis']) {
        result['Semantic analysis'] = await this.performSemanticAnalysis(code);
      }
  
      // Intermediate code generation中间代码生成
      if (options['Intermediate code generation']) {
        result['Intermediate code generation'] = await this.performIntermediateCodeGeneration(code);
      }
  
      // Target code generation目标代码生成
      if (options['Target code generation']) {
        result['Target code generation'] = await this.performTargetCodeGeneration(code);
      }
      return result;
    },
  
    // 词法分析实现
    async performLexicalAnalysis(code) {
      console.log('词法分析开始了');
      const token = lexicalAnalyzer.analyze(code)
      return token;
    },
    // 语法分析实现
    async performSyntaxAnalysis(code) {
      console.log('语法分析开始了');
        // 将 PL/0 代码解析成 token 数组
        const tokens = await this.performLexicalAnalysis(code);
        try {
          // 使用语法分析器进行语法分析
          syntaxAnalyzer.analyze(tokens);
          return syntaxAnalyzer.analysisResult;
        } catch (error) {
          console.error(`语法分析出错了: ${error.message}`);
          return `语法分析错误: ${error.message}`;
        }
    },
    // 语义分析实现
    async performSemanticAnalysis(code) {
      console.log('语义分析开始了');
      const tokens = await this.performLexicalAnalysis(code);
        try {
          // 使用语法分析器进行语法分析
          semanticAnalyzer.analyze(tokens);
          return semanticAnalyzer.analysisResult;
        } catch (error) {
          console.error(`语义分析出错了: ${error.message}`);
          return `语义分析错误: ${error.message}`;
        }
    },
    // 中间代码生成实现
    async performIntermediateCodeGeneration(code) {
      console.log('中间代码生成开始了');
      const syntaxTree = await this.performSyntaxAnalysis(code);
      const intermediateCode = intermediateCodeGenerator.generateIntermediateCode(syntaxTree);
      return intermediateCode;
    },
    
    // 目标代码生成实现
    async performTargetCodeGeneration(code) {
      console.log('目标代码生成开始了');
      const intermediateCode = await this.performIntermediateCodeGeneration(code)
      const targetCode = generateTargetCode(intermediateCode);

      return targetCode;
    },
   
  };
  
  module.exports = compilerModel;
  