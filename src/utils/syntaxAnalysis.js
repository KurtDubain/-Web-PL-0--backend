// 语法分析

const syntaxAnalyzer = {
    tokens: [],
    currentTokenIndex: 0,
    currentToken: null,
    analysisResult: null, // 新增保存语法分析结果的属性
  
    analyze: function (tokens) {
        this.tokens = tokens;
        this.currentTokenIndex = 0;
        this.currentToken = this.tokens[0];

        // PL/0 语法规则的递归下降解析
        this.analysisResult = this.program(); // 将根节点保存为语法分析结果

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
        const programNode = { type: 'Program', children: [this.block()] };
        this.match('Symbol'); // Program 结束时应该是符号结束
        return programNode;
    },
  
    block: function () {
        console.log('Starting Block');
        const blockNode = { type: 'Block', children: [this.declaration(), this.statement()] };
        return blockNode;
    },
  
    declaration: function () {
        console.log('Starting Declaration');
        const declarationNode = { type: 'Declaration', children: [] };
        while (this.currentToken.type === 'Keyword' && this.currentToken.value === 'var') {
            this.match('Keyword');
            const identifierNode = { type: 'Identifier', value: this.currentToken.value };
            this.match('Identifier');
            declarationNode.children.push(identifierNode);
            this.match('Symbol'); // 分号结束
        }
        return declarationNode;
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
