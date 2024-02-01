// src/utils/semanticAnalyzer.js

const semanticAnalyzer = {
    analysisResult: {
      variables: [],
      statements: [],
    },
  
    analyze: function (tokens) {
      this.analysisResult = {
        variables: [],
        statements: [],
      };
  
      // 进行语义分析
      this.program(tokens);
  
      console.log('Semantic analysis completed successfully.');
      console.log('Analysis Result:', this.analysisResult);
    },
  
    program: function (tokens) {
      this.declaration(tokens);
      this.statement(tokens);
    },
  
    declaration: function (tokens) {
      while (
        this.currentTokenIndex < tokens.length &&
        tokens[this.currentTokenIndex].type === 'Keyword' &&
        tokens[this.currentTokenIndex].value === 'var'
      ) {
        this.advance(tokens);
        const variableName = tokens[this.currentTokenIndex].value;
        this.checkVariableDeclaration(variableName);
        this.analysisResult.variables.push(variableName);
        this.advance(tokens); // Identifier
        this.match(tokens, 'Symbol', ';'); // 分号结束
      }
    },
  
    statement: function (tokens) {
      if (
        this.currentTokenIndex < tokens.length &&
        tokens[this.currentTokenIndex].type === 'Identifier'
      ) {
        this.assignmentStatement(tokens);
      } else {
        // 处理其他类型的语句
      }
    },
  
    assignmentStatement: function (tokens) {
      const variableName = tokens[this.currentTokenIndex].value;
      this.checkVariableDeclaration(variableName);
      this.analysisResult.statements.push({
        type: 'assignment',
        variable: variableName,
      });
      this.match(tokens, 'Identifier');
      this.match(tokens, 'Symbol', '='); // 赋值号
      this.expression(tokens);
      this.match(tokens, 'Symbol', ';'); // 分号结束
    },
  
    expression: function (tokens) {
      this.term(tokens);
      while (
        this.currentTokenIndex < tokens.length &&
        tokens[this.currentTokenIndex].type === 'Symbol' &&
        (tokens[this.currentTokenIndex].value === '+' || tokens[this.currentTokenIndex].value === '-')
      ) {
        this.match(tokens, 'Symbol');
        this.term(tokens);
      }
    },
  
    term: function (tokens) {
      this.factor(tokens);
      while (
        this.currentTokenIndex < tokens.length &&
        tokens[this.currentTokenIndex].type === 'Symbol' &&
        (tokens[this.currentTokenIndex].value === '*' || tokens[this.currentTokenIndex].value === '/')
      ) {
        this.match(tokens, 'Symbol');
        this.factor(tokens);
      }
    },
  
    factor: function (tokens) {
      if (
        this.currentTokenIndex < tokens.length &&
        (tokens[this.currentTokenIndex].type === 'Identifier' ||
          tokens[this.currentTokenIndex].type === 'Number')
      ) {
        this.match(tokens, tokens[this.currentTokenIndex].type);
      } else if (
        this.currentTokenIndex < tokens.length &&
        tokens[this.currentTokenIndex].type === 'Symbol' &&
        tokens[this.currentTokenIndex].value === '('
      ) {
        this.match(tokens, 'Symbol');
        this.expression(tokens);
        this.match(tokens, 'Symbol', ')');
      } else {
        throw new Error(`Unexpected token in factor: ${tokens[this.currentTokenIndex].value}`);
      }
    },
  
    match: function (tokens, expectedType, expectedValue = null) {
      const currentToken = tokens[this.currentTokenIndex];
  
      if (currentToken.type === expectedType && (expectedValue === null || currentToken.value === expectedValue)) {
        console.log(`Matched ${expectedType}: ${currentToken.value}`);
        this.advance(tokens);
      } else {
        throw new Error(`Unexpected token: ${currentToken.value}`);
      }
    },
  
    advance: function (tokens) {
      this.currentTokenIndex++;
    },
  
    checkVariableDeclaration: function (variableName) {
      if (this.analysisResult.variables.includes(variableName)) {
        throw new Error(`Semantic Error: Variable '${variableName}' has already been declared.`);
      }
    },
  };
  
  module.exports = semanticAnalyzer;
  