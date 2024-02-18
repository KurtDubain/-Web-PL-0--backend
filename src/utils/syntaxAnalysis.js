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
  
    match(expectedType) {
      if (this.currentToken && this.currentToken.type === expectedType) {
        console.log(this.currentToken)
        this.advance();
      } else {
        
        throw new Error(`Expected token type ${expectedType}-${this.currentToken}, but found ${this.currentToken ? this.currentToken.type : 'EOF'}`);
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
        this.match('Equals');
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
      // Simple implementation, should be expanded
      this.match('Number'); // Assuming an expression is a single number for simplicity
      return { type: 'Expression', value: this.currentToken.value };
    },
  
    ifStatement() {
      this.match('Keyword'); // Match 'if'
      const condition = this.expression(); // Parse condition
      this.match('Keyword'); // Match 'then'
      const thenStatement = this.statement(); // Parse the statement to execute if condition is true
      let elseStatement = null;
      if (this.currentToken && this.currentToken.type === 'Keyword' && this.currentToken.value === 'else') {
        this.match('Keyword'); // Match 'else'
        elseStatement = this.statement(); // Parse the statement to execute if condition is false
      }
      return { type: 'IfStatement', condition, thenStatement, elseStatement };
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
        this.match('Keyword'); // Match 'begin'
        const statements = [];
      
        while (this.currentToken.value !== 'end') {
          const statementNode = this.statement();
          statements.push(statementNode);
      
          // Optionally match semicolon between statements
          if (this.currentToken.type === 'Punctuation' && this.currentToken.value === ';') {
            this.match('Punctuation'); // Match semicolon
          }
        }
      
        this.match('Keyword'); // Match 'end'
      
        return {
          type: 'BeginEndBlock',
          statements
        };
      },
      forStatement() {
        this.match('Keyword'); // Match 'for'
        const variableName = this.currentToken.value;
        this.match('Identifier'); // Match <identifier>
        this.match('Equals'); // Match ':='
        const initialValue = this.expression(); // Parse <initial-value>
        this.match('Keyword'); // Match 'to'
        const finalValue = this.expression(); // Parse <final-value>
        this.match('Keyword'); // Match 'do'
        const body = this.statement(); // Parse <statement>
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


