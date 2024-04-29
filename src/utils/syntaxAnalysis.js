// 语法分析
// 语法分析器对象
// 语法分析器对象
const syntaxAnalyzer = {
  tokens: [], // 用于存储每个token
  currentTokenIndex: 0, //当前位置
  symbolTable: {}, //变量、过程追踪表
  // 获取当前位置的字符
  get currentToken() {
    return this.tokens[this.currentTokenIndex];
  },
  advance() {
    this.currentTokenIndex++;
  },
  // 匹配
  match(expectedType, expectedValue = null) {
    if (this.currentToken && this.currentToken.type === expectedType) {
      // 如果提供了expectedValue，则还需要匹配token的具体值
      if (expectedValue !== null && this.currentToken.value !== expectedValue) {
        throw new Error(
          `Expected token value ${expectedValue}, but found ${
            this.currentToken.value
          },line is ${this.currentToken.line - 1}`
        );
      }
      // console.log(this.currentToken);
      this.advance();
    } else {
      // 抛出错误时，包含更多关于期望和实际的信息
      const foundType = this.currentToken ? this.currentToken.type : "EOF";
      const foundValue = this.currentToken ? this.currentToken.value : "None";
      throw new Error(
        `Expected token type ${expectedType}${
          expectedValue ? " with value " + expectedValue : ""
        }, but found type ${foundType} with value ${foundValue},line is ${
          this.currentToken.line - 1
        }`
      );
    }
  },
  // 核心分析方法
  analyze(tokens) {
    this.tokens = tokens;
    this.currentTokenIndex = 0;
    const ast = this.program();
    if (this.currentTokenIndex < this.tokens.length - 1) {
      throw new Error("Unexpected tokens at the end of input");
    }
    // 返回生成的ast结构
    return ast;
  },

  program() {
    const nodes = [];
    // 判断是否到了最后一个标签
    while (this.currentToken && this.currentToken.type !== "EOF") {
      nodes.push(this.block());

      if (this.currentToken && this.currentToken.value === ".") {
        // 匹配`end`
        this.advance();
      }
    }
    // console.log(this.currentToken);
    return {
      type: "Program",
      children: nodes,
      line: this.currentToken.line,
    };
  },
  // 判断下一个token值
  peek() {
    if (this.currentTokenIndex + 1 < this.tokens.length) {
      return this.tokens[this.currentTokenIndex + 1].value;
    }
    return null; // 如果没有下一个token，则返回null
  },

  block() {
    // 对一个块进行声明和语句的处理
    const declarationNode = this.declaration();
    const statementNode = this.statement();
    return {
      type: "Block",
      children: [declarationNode, statementNode],
      line: this.currentToken.line,
    };
  },
  // 声明处理
  declaration() {
    const declarations = [];
    while (
      this.currentToken &&
      this.currentToken.type === "Keyword" &&
      (this.currentToken.value === "const" || this.currentToken.value === "var")
    ) {
      if (this.currentToken.value === "const") {
        this.match("Keyword"); // 匹配 'const'
        do {
          const constName = this.currentToken.value;
          this.match("Identifier");
          this.match("Equals");
          const constValue = parseInt(this.currentToken.value, 10); // 假设值是整数
          const constLine = parseInt(this.currentToken.line);
          this.match("Number");
          declarations.push({
            type: "ConstDeclaration",
            name: constName,
            value: constValue,
            line: constLine,
          });
          this.symbolTable[constName] = { type: "Constant", value: constValue }; // 更新符号表
          if (this.currentToken.type !== "Comma") break;
          this.match("Comma");
        } while (true);
      } else if (this.currentToken.value === "var") {
        this.match("Keyword"); // 匹配 'var'
        do {
          const varName = this.currentToken.value;
          const varLine = this.currentToken.line;
          this.match("Identifier");
          let varValue = undefined; // 默认不赋值

          // 检查是否有赋值操作符
          if (this.currentToken.type === "Equals") {
            this.match("Equals");
            varValue = parseInt(this.currentToken.value, 10); // 假设值是整数
            this.match("Number");
          }
          declarations.push({
            type: "VarDeclaration",
            value: varValue,
            name: varName,
            line: varLine,
          });
          this.symbolTable[varName] = { type: "Variable", value: undefined }; // 更新符号表，初始值为undefined
          if (this.currentToken.type !== "Comma") break;
          this.match("Comma");
        } while (true);
      }
      this.match("Semicolon");
    }
    return {
      type: "Declaration",
      children: declarations,
      line: this.currentToken.line,
    };
  },
  // 语句的处理
  statement() {
    let statementNode;
    // 判断是否为变量
    if (this.currentToken.type === "Identifier") {
      const identifier = this.currentToken.value;
      // 判断是否为过程名
      if (
        this.symbolTable[identifier] &&
        this.symbolTable[identifier].type === "Procedure"
      ) {
        // 处理过程调用
        this.match("Identifier");
        this.match("Semicolon");
        statementNode = {
          type: "ProcedureCall",
          name: identifier,
          line: this.currentToken.line,
        };
      } else {
        // 如果不是过程名，则为声明
        this.match("Identifier");
        this.match("Equals", ":=");
        const expressionNode = this.expression();
        this.match("Semicolon");
        statementNode = {
          type: "AssignmentStatement",
          identifier,
          expression: expressionNode,
          line: this.currentToken.line,
        };
      }
    } else if (this.currentToken.type === "Keyword") {
      // 如果是关键词，判断处理
      switch (this.currentToken.value) {
        case "if":
          statementNode = this.ifStatement();
          break;
        case "while":
          statementNode = this.whileStatement();
          break;
        case "procedure":
          statementNode = this.procedureStatement();
          break;
        case "begin":
          statementNode = this.beginEndStatement();
          break;
        case "for":
          statementNode = this.forStatement();
          break;
        case "read":
          statementNode = this.parseReadStatement();
          break;
        case "write":
          statementNode = this.parseWriteStatement();
          break;
        case "call":
          statementNode = this.parseProcedureCall(); // 已有逻辑可以复用
          break;
        // Add other control structures here
        default:
          throw new Error(
            `Unsupported statement with keyword ${this.currentToken.value}`
          );
      }
    }
    // Add handling of other statement types here
    return statementNode;
  },
  // 解析单个语句
  parseSingleStatement() {
    // 假设单条语句可能是赋值、过程调用或其他简单的操作
    if (this.currentToken.type === "Identifier") {
      // 可能是赋值或过程调用
      let nextToken = this.peek();
      // console.log(nextToken)
      if (nextToken && nextToken === ":=") {
        // 赋值语句
        return this.parseAssignmentStatement();
      } else {
        // 过程调用
        return this.parseProcedureCall();
      }
    } else {
      // 空
    }
  },
  // 解析赋值语句
  parseAssignmentStatement() {
    const identifier = this.currentToken.value; // 当前token应为变量名
    const line = this.currentToken.line;
    this.match("Identifier"); // 消费变量名
    this.match("Equals", ":="); // 消费赋值操作符
    const expression = this.expression(); // 解析赋值右侧的表达式
    this.match("Semicolon"); // 赋值语句结束后应有分号
    return {
      type: "AssignmentStatement",
      identifier: identifier,
      expression: expression,
      line: line,
    };
  },
  // 解析过程调用
  parseProcedureCall() {
    this.match("Keyword", "call");
    const line = this.currentToken.line;
    const procedureName = this.currentToken.value; // 当前token为过程名
    this.match("Identifier"); // 消费过程名
    this.match("Semicolon"); // 过程调用结束后应有分号
    return {
      type: "ProcedureCall",
      name: procedureName,
      line: line,
    };
  },
  // 解析Read关键字
  parseReadStatement() {
    this.match("Keyword", "read");
    const line = this.currentToken.line;
    const variableName = this.currentToken.value;
    this.match("Identifier"); // 消费变量名
    this.match("Semicolon"); // 语句结束
    return {
      type: "ReadStatement",
      variableName,
      line: line,
    };
  },
  // 解析write关键字
  parseWriteStatement() {
    this.match("Keyword", "write");
    const line = this.currentToken.line;
    const expressionNode = this.expression(); // 解析要输出的表达式
    this.match("Semicolon"); // 语句结束
    return {
      type: "WriteStatement",
      expression: expressionNode,
      line: line,
    };
  },
  // 逻辑表达式的解析
  expression() {
    let left = this.arithmeticExpression(); // 首先解析算术表达式
    while (
      this.currentToken &&
      ["<", "<=", "=", "<>", ">", ">="].includes(this.currentToken.value)
    ) {
      const operator = this.currentToken.value;
      const line = this.currentToken.line;
      this.match("Operator"); // 匹配比较操作符
      let right = this.arithmeticExpression(); // 再次解析算术表达式作为右侧
      // 构建比较表达式的AST节点
      left = {
        type: "BinaryExpression",
        operator: operator,
        left: left,
        right: right,
        line: line,
      };
    }
    return left;
  },
  // 计算解析（加减法）
  arithmeticExpression() {
    let node = this.term();
    while (this.currentToken && ["+", "-"].includes(this.currentToken.value)) {
      const operator = this.currentToken.value;
      const line = this.currentToken.line;
      this.match("Operator", operator); // 匹配加减运算符
      const right = this.term(); // 解析右侧的term
      node = {
        type: "BinaryExpression",
        operator: operator,
        left: node,
        right: right,
        line: line,
      };
    }
    return node;
  },
  // 计算解析（乘除法）
  term() {
    let node = this.factor();
    while (this.currentToken && ["*", "/"].includes(this.currentToken.value)) {
      const operator = this.currentToken.value;
      const line = this.currentToken.line;
      this.match("Operator", operator); // 匹配乘除运算符
      const right = this.factor(); // 解析右侧的factor
      node = {
        type: "BinaryExpression",
        operator: operator,
        left: node,
        right: right,
        line: line,
      };
    }
    return node;
  },
  // 因子解析
  factor() {
    // 这个方法需要解析数字和括号内的表达式
    if (this.currentToken.type === "Number") {
      const node = {
        type: "Literal",
        value: this.currentToken.value,
        line: this.currentToken.line,
      };
      this.advance(); // 前进到下一个token
      return node;
    } else if (this.currentToken.type === "Identifier") {
      const node = {
        type: "Identifier",
        name: this.currentToken.value,
        line: this.currentToken.line,
      };
      this.advance(); // 前进到下一个token
      return node;
    } else if (this.currentToken.value === "(") {
      this.match("Operator", "("); // 匹配左括号
      // console.log("222");
      let node = this.expression(); // 解析括号内的表达式
      this.match("Operator", ")"); // 匹配右括号
      // console.log(node);
      return node;
    }
    throw new Error(
      `Unexpected token: ${this.currentToken.value},line is ${this.currentToken.line}`
    );
  },

  ifStatement() {
    this.match("Keyword", "if"); // 匹配 'if'
    const condition = this.expression(); // 解析条件表达式
    this.match("Keyword", "then"); // 匹配 'then'
    const ifLine = this.currentToken.line;
    let thenStatement = null;
    // 直接检查下一个token，决定是解析单条语句还是多条语句
    if (this.currentToken.value === "begin") {
      // 如果是begin，则预期为多条语句，使用beginEndStatement解析
      thenStatement = this.beginEndStatement();
      this.match("Semicolon");
    } else {
      // 否则，解析单条语句
      // thenStatement = this.parseSingleStatement();
      thenStatement = this.statement();
      // this.match("Semicolon");
    }
    let elseStatement = null;
    const elseIfStatements = [];
    while (this.currentToken.value === "else") {
      this.match("Keyword", "else");
      if (this.currentToken.value === "if") {
        this.match("Keyword", "if");
        const elseifCondition = this.expression();
        this.match("Keyword", "then");
        if (this.currentToken.value === "begin") {
          // 如果是begin，则预期为多条语句，使用beginEndStatement解析
          const elseifThenStatement = this.beginEndStatement();
          this.match("Semicolon");
          elseIfStatements.push({
            condition: elseifCondition,
            thenStatement: elseifThenStatement,
          });
        } else {
          // 否则，解析单条语句
          // thenStatement = this.parseSingleStatement();
          const elseifThenStatement = this.statement();
          // this.match("Semicolon");
          elseIfStatements.push({
            condition: elseifCondition,
            thenStatement: elseifThenStatement,
          });
        }
        // this.match("Semicolon");
      } else {
        if (this.currentToken.value === "begin") {
          elseStatement = this.beginEndStatement();
          this.match("Semicolon");
        } else {
          elseStatement = this.statement();
          // this.match("Semicolon");
        }
      }
    }
    this.match("Keyword", "endif");
    this.match("Semicolon");
    return {
      type: "IfStatement",
      condition: condition,
      thenStatement: thenStatement,
      elseIfStatement: elseIfStatements,
      elseStatement: elseStatement,
      line: ifLine,
    };
  },

  whileStatement() {
    this.match("Keyword", "while"); // 匹配while
    const condition = this.expression();
    const line = this.currentToken.line;
    this.match("Keyword", "do");
    const doStatement = this.beginEndStatement();
    this.match("Semicolon", ";");
    this.match("Keyword", "endwhile");
    this.match("Semicolon", ";");
    return {
      type: "WhileStatement",
      condition,
      doStatement,
      line: line,
    };
  },
  procedureStatement() {
    this.match("Keyword"); // 匹配过程声明
    const procedureName = this.currentToken.value;
    const line = this.currentToken.line;
    this.match("Identifier");

    this.match("Semicolon");
    this.symbolTable[procedureName] = { type: "Procedure", body: null };
    const blockNode = this.block();
    this.symbolTable[procedureName].body = blockNode;
    this.match("Semicolon");

    return {
      type: "ProcedureDeclaration",
      name: procedureName,
      body: blockNode,
      line: line,
    };
  },
  beginEndStatement() {
    this.match("Keyword", "begin"); // 匹配begin块
    const statements = [];
    const line = this.currentToken.line;
    while (this.currentToken.value !== "end") {
      const statementNode = this.statement();
      statements.push(statementNode);

      if (
        this.currentToken.type === "Semicolon" &&
        this.currentToken.value === ";"
      ) {
        this.match("Semicolon"); // Match semicolon
        // this.advance();
      }
    }
    this.match("Keyword", "end"); // Match 'end'
    // this.match("Semicolon");
    return {
      type: "BeginEndBlock",
      statements,
      line: line,
    };
  },
  forStatement() {
    this.match("Keyword", "for"); //for循环处理
    const variableName = this.currentToken.value;
    const forLine = this.currentToken.line;
    this.match("Identifier");
    this.match("Equals", ":=");
    const initialValue = this.expression(); // 匹配for初始化的表达式
    this.match("Keyword", "to"); //
    const finalValue = this.expression(); //
    this.match("Keyword", "do"); //
    let loopBody = null;
    if (this.currentToken.value === "begin") {
      // 如果循环体以 'begin' 开始，则预期是多条语句
      loopBody = this.beginEndStatement(); // 解析 begin...end 结构
      this.match("Semicolon");
    } else {
      // 否则，解析单条语句作为循环体
      loopBody = this.statement(); // 解析单条语句
      this.match("Semicolon", ";");
    }

    // ;
    this.match("Keyword", "endfor");
    this.match("Semicolon", ";");
    return {
      type: "ForStatement",
      variableName: variableName,
      initialValue: initialValue,
      finalValue: finalValue,
      body: loopBody,
      line: forLine,
    };
  },
};

module.exports = syntaxAnalyzer;
