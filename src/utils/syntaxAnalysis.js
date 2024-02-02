// 语法分析
// 语法分析器对象
// 语法分析器对象
const syntaxAnalyzer = {
  // 保存分析器要处理的token数组
  tokens: [],
  // 当前处理的索引
  currentTokenIndex: 0,
  currentToken: null,
  analysisResult: null, // 新增保存语法分析结果的属性

  // 分析入口函数，接受token数组作为输入
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
  // 匹配当前的token的类型是否符合期望类型，如果匹配成功则前进到下一个token
  match: function (expectedType) {
    console.log(this.currentToken.type,expectedType,this.currentToken.type==expectedType)
    if (this.currentToken.type === expectedType) {
      console.log(`Matched ${expectedType}: ${this.currentToken.value}`);
      this.analysisResult += `Matched ${expectedType}: ${this.currentToken.value}\n`; // 记录匹配结果
      this.advance();
    } else {
      throw new Error(`Unexpected token: ${this.currentToken.value}`);
    }
  },
  // 前进到下一个token
  advance: function () {
    this.currentTokenIndex++;
    this.currentToken = this.tokens[this.currentTokenIndex];
  },
  // Program规则的解析函数
  program: function () {
      console.log('Starting Program');
      const programNode = { type: 'Program', children: [this.block()] };
      this.match('Semicolon'); // Program 结束时应该是分号结束
      return programNode;
  },
  // 对于block规则的解析函数
  block: function () {
      console.log('Starting Block');
      const blockNode = { type: 'Block', children: [this.declaration(), this.statement()] };
      return blockNode;
  },
  // 声明规则的解析函数
  declaration: function () {
    console.log('Starting Declaration');
    const declarationNode = { type: 'Declaration', children: [] };

    // 解析声明语句，可能有多个变量声明
    while (this.currentToken.type === 'Keyword' && (this.currentToken.value === 'var' || this.currentToken.value === 'const')) {
        this.match('Keyword'); // 匹配 var 或 const 关键字
        const identifierNode = { type: 'Identifier', value: this.currentToken.value };
        this.match('Identifier'); // 匹配标识符

        // 检查是否存在赋值符号 :=
        if (this.currentToken.type === 'Equals') {
            this.match('Equals'); // 匹配赋值符号
            this.expression(); // 处理赋值语句右侧表达式
        }

        declarationNode.children.push(identifierNode);
        this.match('Semicolon'); // 分号结束
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
  // assignment Statement规则的解析函数
  assignmentStatement: function () {
      console.log('Starting Assignment Statement');
      this.analysisResult += 'Starting Assignment Statement\n';
      this.match('Identifier');
      this.match('Equals'); // 赋值号
      this.expression();
      this.match('Semicolon'); // 分号结束
  },
  // 处理加减法规则
  expression: function () {
      console.log('Starting Expression');
      this.analysisResult += 'Starting Expression\n';
      this.term();
      while (this.currentToken.type === 'Operator' && (this.currentToken.value === '+' || this.currentToken.value === '-')) {
          this.match('Operator');
          this.term();
      }
  },
  // 处理乘除法规则
  term: function () {
      console.log('Starting Term');
      this.analysisResult += 'Starting Term\n';
      this.factor();
      while (this.currentToken.type === 'Operator' && (this.currentToken.value === '*' || this.currentToken.value === '/')) {
          this.match('Operator');
          this.factor();
      }
  },
  // 匹配乘数
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


