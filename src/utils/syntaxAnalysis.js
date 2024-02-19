// 语法分析
// 语法分析器对象
// 语法分析器对象
const syntaxAnalyzer = {
    tokens: [],
    currentTokenIndex: 0,
    
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
      if (this.currentTokenIndex < this.tokens.length) {
        throw new Error('Unexpected tokens at the end of input');
      }
      return ast;
    },
  
    program() {
      // A program consists of a block followed by a period
      const blockNode = this.block();
      this.match('Semicolon'); // Assuming the end of the block is marked by a semicolon
      return { type: 'Program', children: [blockNode] };
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
          this.match('Keyword'); // Match 'const'
          do {
            const constName = this.currentToken.value;
            this.match('Identifier');
            this.match('Equals');
            const constValue = this.currentToken.value;
            this.match('Number');
            declarations.push({ type: 'ConstDeclaration', name: constName, value: constValue });
            if (this.currentToken.type !== 'Comma') break;
            this.match('Comma');
          } while (true);
        } else if (this.currentToken.value === 'var') {
          this.match('Keyword'); // Match 'var'
          do {
            const varName = this.currentToken.value;
            this.match('Identifier');
            declarations.push({ type: 'VarDeclaration', name: varName });
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
        this.match('Identifier');
        this.match('Equals',':=');
        const expressionNode = this.expression();
        statementNode = { type: 'AssignmentStatement', identifier, expression: expressionNode };
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
  
    // Placeholder for expression parsing, to be implemented based on PL/0 grammar
    
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
      this.match('Keyword','if'); // 匹配 'if'
      const condition = this.expression(); // 解析条件表达式
      this.match('Keyword','then'); // 匹配 'then'
      const thenStatement = this.statement(); // 解析 'then' 分支
      let elseStatement = null;
      if (this.currentToken && this.currentToken.type === 'Keyword' && this.currentToken.value === 'else') {
        this.match('Keyword','else'); // 匹配 'else'
        elseStatement = this.statement(); // 解析 'else' 分支
      }
      return {
        type: 'IfStatement',
        condition: condition,
        thenStatement: thenStatement,
        elseStatement: elseStatement
      };
    },
  
    whileStatement() {
      this.match('Keyword'); // Match 'while'
      const condition = this.expression(); // Parse condition
      this.match('Keyword'); // Match 'do'
      const doStatement = this.statement(); // Parse the statement to execute as long as condition is true
      return { type: 'WhileStatement', condition, doStatement };
    },
    procedureStatement() {
        this.match('Keyword'); // Match 'procedure'
        const procedureName = this.currentToken.value;
        this.match('Identifier'); // Match procedure name
      
        // Assuming procedures don't have parameters for simplicity
        this.match('Semicolon'); // Match semicolon after procedure declaration
      
        const blockNode = this.block(); // Parse the procedure body
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
        this.match('Semicolon',';')
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
        const body = this.statement(); // Parse <statement>
        this.match('Semicolon', ';');
        this.match('Keyword', 'end');
        // Match the semicolon after 'end'
        this.match('Semicolon', ';');
        return {
          type: 'ForStatement',
          variableName: variableName,
          initialValue: initialValue,
          finalValue: finalValue,
          body: body
        };
      },
      
      
    // Implement other methods like ifStatement, whileStatement, etc., based on PL/0 grammar
  };


module.exports = syntaxAnalyzer;


