// 语法分析
// 语法分析器对象
// 语法分析器对象
const symbolTable = {}
const syntaxAnalyzer = {
    tokens: [],
    currentTokenIndex: 0,
    symbolTable:{},
    get currentToken() {
      return this.tokens[this.currentTokenIndex];
    },
  
    advance() {
      this.currentTokenIndex++;
    },
  
    match(expectedType, expectedValue = null) {
      if (this.currentToken && this.currentToken.type === expectedType) {
        // 如果提供了expectedValue，则还需要匹配token的具体值
        if (expectedValue !== null && this.currentToken.value !== expectedValue) {
          throw new Error(`Expected token value ${expectedValue}, but found ${this.currentToken.value}`);
        }
        console.log(this.currentToken);
        this.advance();
      } else {
        // 抛出错误时，包含更多关于期望和实际的信息
        const foundType = this.currentToken ? this.currentToken.type : 'EOF';
        const foundValue = this.currentToken ? this.currentToken.value : 'None';
        throw new Error(`Expected token type ${expectedType}${expectedValue ? ' with value ' + expectedValue : ''}, but found type ${foundType} with value ${foundValue}`);
      }
    },
  
    analyze(tokens) {
      this.tokens = tokens;
      this.currentTokenIndex = 0;
      const ast = this.program();
      if (this.currentTokenIndex < this.tokens.length-1) {
        throw new Error('Unexpected tokens at the end of input');
      }
      return ast;
    },
  
    program() {
      const nodes = []
      while(this.currentToken && this.currentToken.type!=='EOF'){
        nodes.push(this.block())
  
        if (this.currentToken && this.currentToken.value === '.') {
          // 匹配`end`
          this.advance()
        }
      }
      return {
        type:'Program',
        children:nodes
      }
    },
    peek() {
      if (this.currentTokenIndex + 1 < this.tokens.length) {
          return this.tokens[this.currentTokenIndex + 1].value;
      }
      return null; // 如果没有下一个token，则返回null
    },
  
    block() {
      // A block can contain a declaration followed by a statement
      const declarationNode = this.declaration();
      const statementNode = this.statement();
      return { type: 'Block', children: [declarationNode, statementNode] };
    },
  
    declaration() {
      const declarations = [];
      while (this.currentToken && this.currentToken.type === 'Keyword' && (this.currentToken.value === 'const' || this.currentToken.value === 'var')) {
          if (this.currentToken.value === 'const') {
              this.match('Keyword'); // 匹配 'const'
              do {
                  const constName = this.currentToken.value;
                  this.match('Identifier');
                  this.match('Equals');
                  const constValue = parseInt(this.currentToken.value, 10); // 假设值是整数
                  this.match('Number');
                  declarations.push({ type: 'ConstDeclaration', name: constName, value: constValue });
                  this.symbolTable[constName] = { type: 'Constant', value: constValue }; // 更新符号表
                  if (this.currentToken.type !== 'Comma') break;
                  this.match('Comma');
              } while (true);
          } else if (this.currentToken.value === 'var') {
              this.match('Keyword'); // 匹配 'var'
              do {
                  const varName = this.currentToken.value;
                  this.match('Identifier');
                  declarations.push({ type: 'VarDeclaration', name: varName });
                  this.symbolTable[varName] = { type: 'Variable', value: undefined }; // 更新符号表，初始值为undefined
                  if (this.currentToken.type !== 'Comma') break;
                  this.match('Comma');
              } while (true);
          }
          this.match('Semicolon');
      }
      return { type: 'Declaration', children: declarations };
    },
  
    statement() {
      let statementNode;
      // Assuming the statement starts with an identifier (for assignment) or a keyword (for control structures)
      if (this.currentToken.type === 'Identifier') {
        const identifier = this.currentToken.value;
        if (this.symbolTable[identifier] && this.symbolTable[identifier].type === 'Procedure') {
          // 处理过程调用
          this.match('Identifier');
          this.match('Semicolon');
          statementNode = { type: 'ProcedureCall', name: identifier };
        }else{
          this.match('Identifier');
          this.match('Equals',':=');
          const expressionNode = this.expression();
          statementNode = { type: 'AssignmentStatement', identifier, expression: expressionNode };
        }
        
      } else if (this.currentToken.type === 'Keyword') {
        switch (this.currentToken.value) {
          case 'if':
            statementNode = this.ifStatement();
            break;
          case 'while':
            statementNode = this.whileStatement();
            break;
          case 'procedure':
            statementNode = this.procedureStatement();
            break;
          case 'begin':
            statementNode = this.beginEndStatement();
            break;
          case 'for':
            statementNode = this.forStatement();
            break;
          // Add other control structures here
          default:
            throw new Error(`Unsupported statement with keyword ${this.currentToken.value}`);
        }
      }
      // Add handling of other statement types here
      return statementNode;
    },
    parseSingleStatement() {
      // 假设单条语句可能是赋值、过程调用或其他简单的操作
      if (this.currentToken.type === 'Identifier') {
          // 可能是赋值或过程调用
          let nextToken = this.peek();
          // console.log(nextToken)
          if (nextToken && nextToken === ':=') {
              // 赋值语句
              return this.parseAssignmentStatement();
          } else {
              // 过程调用
              return this.parseProcedureCall();
          }
      } else {
          // 其他类型的单条语句处理，例如：空语句（NOP），在这里添加
      }
    },
    parseAssignmentStatement() {
      const identifier = this.currentToken.value; // 当前token应为变量名
      this.match('Identifier'); // 消费变量名
      this.match('Equals', ':='); // 消费赋值操作符
      const expression = this.expression(); // 解析赋值右侧的表达式
      this.match('Semicolon'); // 赋值语句结束后应有分号
      return {
          type: 'AssignmentStatement',
          identifier: identifier,
          expression: expression
      };
    },
    parseProcedureCall() {
      const procedureName = this.currentToken.value; // 当前token为过程名
      this.match('Identifier'); // 消费过程名
      this.match('Semicolon'); // 过程调用结束后应有分号
      return {
          type: 'ProcedureCall',
          name: procedureName
      };
    },
  
      
    expression() {
      let left = this.arithmeticExpression(); // 首先解析算术表达式
      while (this.currentToken && ['<', '<=', '=', '<>', '>', '>='].includes(this.currentToken.value)) {
        const operator = this.currentToken.value;
        this.match('Operator'); // 匹配比较操作符
        let right = this.arithmeticExpression(); // 再次解析算术表达式作为右侧
        // 构建比较表达式的AST节点
        left = {
          type: 'BinaryExpression',
          operator: operator,
          left: left,
          right: right
        };
      }
      return left;
    },
    
    arithmeticExpression() {
      let node = this.term();
      while (this.currentToken && ['+', '-'].includes(this.currentToken.value)) {
        const operator = this.currentToken.value;
        this.match('Operator', operator); // 匹配加减运算符
        const right = this.term(); // 解析右侧的term
        node = {
          type: 'BinaryExpression',
          operator: operator,
          left: node,
          right: right
        };
      }
      return node;
    },
    
    term() {
      let node = this.factor();
      while (this.currentToken && ['*', '/'].includes(this.currentToken.value)) {
        const operator = this.currentToken.value;
        this.match('Operator', operator); // 匹配乘除运算符
        const right = this.factor(); // 解析右侧的factor
        node = {
          type: 'BinaryExpression',
          operator: operator,
          left: node,
          right: right
        };
      }
      return node;
    },
    
    factor() {
      // 这个方法需要解析数字和括号内的表达式
      if (this.currentToken.type === 'Number') {
        const node = { type: 'Literal', value: this.currentToken.value };
        this.advance(); // 前进到下一个token
        return node;
      } else if (this.currentToken.type === 'Identifier') {
        const node = { type: 'Identifier', name: this.currentToken.value };
        this.advance(); // 前进到下一个token
        return node;
      } else if (this.currentToken.value === '(') {
        this.match('Operator', '('); // 匹配左括号
        let node = this.expression(); // 解析括号内的表达式
        this.match('Operator', ')'); // 匹配右括号
        return node;
      }
      throw new Error(`Unexpected token: ${this.currentToken.value}`);
    },
  
    ifStatement() {
      this.match('Keyword', 'if'); // 匹配 'if'
      const condition = this.expression(); // 解析条件表达式
      this.match('Keyword', 'then'); // 匹配 'then'
  
      let thenStatement = null;
      // 直接检查下一个token，决定是解析单条语句还是多条语句
      if (this.currentToken.value === 'begin') {
          // 如果是begin，则预期为多条语句，使用beginEndStatement解析
          thenStatement = this.beginEndStatement();
      } else {
          // 否则，解析单条语句
          // thenStatement = this.parseSingleStatement();
          thenStatement = this.statement()
          this.match('Semicolon')
      }
      let elseStatement = null;
      // console.log(this.currentToken.value)
      if (this.currentToken.value === 'else') {
        this.match('Keyword', 'else'); // 消费掉else关键字
          // 再次检查else后是否跟begin，以相同方式决定是单条语句还是多条语句
          if (this.currentToken.value === 'begin') {
              elseStatement = this.beginEndStatement();
              this.match('Semicolon')
          } else {
              elseStatement = this.statement();
              this.match('Semicolon')
          }
      }
      this.match('Keyword','end')
      this.match('Semicolon')
      return {
          type: 'IfStatement',
          condition: condition,
          thenStatement: thenStatement,
          elseStatement: elseStatement
      };
    },
  
    whileStatement() {
      this.match('Keyword','while'); // Match 'while'
      const condition = this.expression(); // Parse condition
      this.match('Keyword','do'); // Match 'do'
      const doStatement = this.statement(); // Parse the statement to execute as long as condition is true
      return { type: 'WhileStatement', condition, doStatement };
    },
    procedureStatement() {
        this.match('Keyword'); // Match 'procedure'
        const procedureName = this.currentToken.value;
        this.match('Identifier'); // Match procedure name
      
        this.match('Semicolon'); // Match semicolon after procedure declaration
        this.symbolTable[procedureName] = {type:'Procedure',body:null}
        const blockNode = this.block(); // Parse the procedure body
        this.symbolTable[procedureName].body = blockNode
        this.match('Semicolon'); // Match semicolon at the end of the procedure body
      
        return {
          type: 'ProcedureDeclaration',
          name: procedureName,
          body: blockNode
        };
      },
    beginEndStatement() {
      this.match('Keyword','begin'); // Match 'begin'
      const statements = [];
      
      while (this.currentToken.value !== 'end') {
        const statementNode = this.statement();
        statements.push(statementNode);
      
        // Optionally match semicolon between statements
        if (this.currentToken.type === 'Semicolon' && this.currentToken.value === ';') {
            // this.match('Semicolon'); // Match semicolon
          this.advance()
        }
      }
      this.match('Keyword','end'); // Match 'end'
      return {
        type: 'BeginEndBlock',
        statements
      };
    },
    forStatement() {
      this.match('Keyword','for'); // Match 'for'
      const variableName = this.currentToken.value;
      this.match('Identifier'); // Match <identifier>
      this.match('Equals',':='); // Match ':='
      const initialValue = this.expression(); // Parse <initial-value>
      this.match('Keyword','to'); // Match 'to'
      const finalValue = this.expression(); // Parse <final-value>
      this.match('Keyword','do'); // Match 'do'
      let loopBody = null
      if (this.currentToken.value === 'begin') {
        // 如果循环体以 'begin' 开始，则预期是多条语句
        loopBody = this.beginEndStatement(); // 解析 begin...end 结构
      } else {
          // 否则，解析单条语句作为循环体
        loopBody = this.statement(); // 解析单条语句
        this.match('Semicolon', ';')
      }
      
      // ;
      this.match('Keyword', 'end');
        // Match the semicolon after 'end'
      this.match('Semicolon', ';');
      return {
        type: 'ForStatement',
        variableName: variableName,
        initialValue: initialValue,
        finalValue: finalValue,
        body: loopBody
      };
    },
      
      
    // Implement other methods like ifStatement, whileStatement, etc., based on PL/0 grammar
  };


module.exports = syntaxAnalyzer;


