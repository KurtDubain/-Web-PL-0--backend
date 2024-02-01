// src/utils/syntaxAnalyzer.js

const syntaxAnalyzer = {
    tokens: [],
    currentTokenIndex: 0,
    currentToken: null,
    analysisResult: '', // 新增保存语法分析结果的属性
  
    analyze: function (tokens) {
      this.tokens = tokens;
      this.currentTokenIndex = 0;
      this.currentToken = this.tokens[0];
  
      // PL/0 语法规则的递归下降解析
      this.program();
  
      // 如果解析完毕后还有剩余的 token，则说明语法有误
      if (this.currentTokenIndex < this.tokens.length) {
        throw new Error(`Unexpected token: ${this.currentToken.value}`);
      }
  
      console.log('Syntax analysis completed successfully.');
    },
  
    match: function (expectedType) {
      if (this.currentToken.type === expectedType) {
        console.log(`Matched ${expectedType}: ${this.currentToken.value}`);
        this.analysisResult += `Matched ${expectedType}: ${this.currentToken.value}\n`; // 记录匹配结果
        this.advance();
      } else {
        throw new Error(`Unexpected token: ${this.currentToken.value}`);
      }
    },
  
    advance: function () {
      this.currentTokenIndex++;
      this.currentToken = this.tokens[this.currentTokenIndex];
    },
  
    program: function () {
      console.log('Starting Program');
      this.analysisResult += 'Starting Program\n';
      this.block();
      this.match('Symbol'); // Program 结束时应该是符号结束
    },
  
    block: function () {
      console.log('Starting Block');
      this.analysisResult += 'Starting Block\n';
      this.declaration();
      this.statement();
    },
  
    declaration: function () {
        console.log('Starting Declaration');
        this.analysisResult += 'Starting Declaration\n';
        while (this.currentToken.type === 'Keyword' && this.currentToken.value === 'var') {
          this.match('Keyword');
          this.match('Identifier');
          this.match('Symbol'); // 分号结束
        }
      },
      
      statement: function () {
        console.log('Starting Statement');
        this.analysisResult += 'Starting Statement\n';
        if (this.currentToken.type === 'Identifier') {
          this.assignmentStatement();
        } else {
          // 处理其他类型的语句
        }
      },
      
      assignmentStatement: function () {
        console.log('Starting Assignment Statement');
        this.analysisResult += 'Starting Assignment Statement\n';
        this.match('Identifier');
        this.match('Symbol'); // 赋值号
        this.expression();
        this.match('Symbol'); // 分号结束
      },
      
      expression: function () {
        console.log('Starting Expression');
        this.analysisResult += 'Starting Expression\n';
        this.term();
        while (this.currentToken.type === 'Symbol' && (this.currentToken.value === '+' || this.currentToken.value === '-')) {
          this.match('Symbol');
          this.term();
        }
      },
      
      term: function () {
        console.log('Starting Term');
        this.analysisResult += 'Starting Term\n';
        this.factor();
        while (this.currentToken.type === 'Symbol' && (this.currentToken.value === '*' || this.currentToken.value === '/')) {
          this.match('Symbol');
          this.factor();
        }
      },
      
      factor: function () {
        console.log('Starting Factor');
        this.analysisResult += 'Starting Factor\n';
        if (this.currentToken.type === 'Identifier' || this.currentToken.type === 'Number') {
          this.match(this.currentToken.type);
        } else if (this.currentToken.type === 'Symbol' && this.currentToken.value === '(') {
          this.match('Symbol');
          this.expression();
          this.match('Symbol');
        } else {
          throw new Error(`Unexpected token in factor: ${this.currentToken.value}`);
        }
      }
  };
  
  module.exports = syntaxAnalyzer;
