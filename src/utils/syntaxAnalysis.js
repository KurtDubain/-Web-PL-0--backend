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

            // 处理逗号分隔的多个变量声明
            do {
                const identifierNode = { type: 'Identifier', value: this.currentToken.value };
                this.match('Identifier'); // 匹配标识符

                // 检查是否存在赋值符号 :=
                if (this.currentToken.type === 'Equals') {
                    this.match('Equals'); // 匹配赋值符号
                    this.expression(); // 处理赋值语句右侧表达式
                }

                declarationNode.children.push(identifierNode);

                // 如果下一个标记是逗号，继续处理下一个变量声明
                if (this.currentToken.type === 'Comma') {
                    this.match('Comma'); // 匹配逗号
                } else {
                    break; // 没有逗号，结束循环
                }
            } while (true);

            this.match('Semicolon'); // 分号结束
        }

        return declarationNode;
    },

    statement: function () {
        console.log('Starting Statement');
        this.analysisResult += 'Starting Statement\n';
        if (this.currentToken.type === 'Identifier') {
            this.assignmentStatement();
        } else if (this.currentToken.type === 'Keyword') {
            if (this.currentToken.value === 'if') {
                this.ifStatement();
            } else if (this.currentToken.value === 'while') {
                this.whileStatement();
            } else if (this.currentToken.value === 'read') {
                this.readStatement();
            } else if (this.currentToken.value === 'write') {
                this.writeStatement();
            } else if (this.currentToken.value === 'for') {
                this.forStatement();
            } else if(this.currentToken.value === 'procedure'){
                this.procedureDeclaration()
            }
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
  },
  program: function () {
        console.log('Starting Program');
        const programNode = { type: 'Program', children: [this.block()] };
        this.match('Semicolon'); // Program 结束时应该是分号结束
        return programNode;
    },
    procedureDeclaration:function(){
        // console.log('')
        const procedureNode = {
            type:'ProcedureDeclaration',
            children:[]
        }
        // 解析过程名
        this.match('Keyword', 'procedure');
        const procedureName = this.currentToken.value;
        this.match('Identifier');
        
        // 解析参数列表（如果有）
        if (this.currentToken.type === 'Symbol' && this.currentToken.value === '(') {
            this.match('Symbol', '(');
            // 解析参数列表的语法规则
            // 注意：这部分内容可能涉及到参数的定义，需要进一步处理
            this.match('Symbol', ')');
        }

        // 解析过程体
        procedureNode.children.push(this.block());

        // 解析过程结束符号
        this.match('Semicolon');

        return procedureNode;
    },
    ifStatement:function(){
        console.log('Starting If Statement');
        const ifNode = { type: 'IfStatement', children: [] };
    
        // 解析条件表达式
        this.match('Keyword', 'if');
        this.expression(); // 解析条件表达式
        this.match('Keyword', 'then');
    
        // 解析if语句体
        ifNode.children.push(this.statement());
    
        // 如果有else分支
        if (this.currentToken.type === 'Keyword' && this.currentToken.value === 'else') {
            this.match('Keyword', 'else');
            // 解析else语句体
            ifNode.children.push(this.statement());
        }
    
        return ifNode;
    },
    whileStatement:function(){
        console.log('Starting While Statement');
        const whileNode = { type: 'WhileStatement', children: [] };
    
        // 解析循环条件
        this.match('Keyword', 'while');
        this.expression(); // 解析循环条件表达式
        this.match('Keyword', 'do');
    
        // 解析循环体
        whileNode.children.push(this.statement());
    
        return whileNode;
    },
    readStatement:function(){
        console.log('Starting Read Statement');
        const readNode = { type: 'ReadStatement', children: [] };
    
        // 解析read语句的参数（可能是变量）
        this.match('Keyword', 'read');
        this.match('Symbol', '(');
        // 解析参数列表的语法规则
        this.match('Identifier'); // 假设这里只有一个变量
        this.match('Symbol', ')');
        this.match('Semicolon');
    
        return readNode;
    },
    writeStatement:function(){
        console.log('Starting Write Statement');
        const writeNode = { type: 'WriteStatement', children: [] };
    
        // 解析write语句的参数（可能是表达式）
        this.match('Keyword', 'write');
        this.match('Symbol', '(');
        // 解析参数列表的语法规则
        this.expression(); // 假设这里只有一个表达式
        this.match('Symbol', ')');
        this.match('Semicolon');
    
        return writeNode;
    },
    forStatement:function(){
        console.log('Starting For Statement');
        const forNode = { type: 'ForStatement', children: [] };
    
        // 解析for循环的控制条件
        this.match('Keyword', 'for');
        this.match('Identifier'); // 解析循环变量
        this.match('Operator', ':='); // 解析赋值符号
        this.expression(); // 解析起始表达式
        this.match('Keyword', 'to'); // 解析to关键字
        this.expression(); // 解析终止表达式
        this.match('Keyword', 'do'); // 解析do关键字
    
        // 解析循环体
        forNode.children.push(this.statement());
    
        return forNode;
    }
};

module.exports = syntaxAnalyzer;


