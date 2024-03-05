const semanticAnalyzer = {
  symbolTable: {}, // 使用对象作为简化的符号表

  // 初始化或重置分析器状态
  init() {
    this.symbolTable = {};
  },

  // 分析AST节点
  analyze(node) {
    this.init(); // 初始化符号表
    this.processNode(node); // 从根节点开始处理
    return this.symbolTable; // 返回分析结果，这里是符号表
  },

  // 根据节点类型分发到具体的处理方法
  processNode(node) {
    // console.log(node);
    switch (node.type) {
      case "Program":
      case "Block":
        this.processChildren(node);
        break;
      case "BeginEndBlock":
        this.processStatements(node.statements);
        break;
      case "Declaration":
        this.processDeclaration(node);
        break;
      case "ProcedureDeclaration":
        this.processProcedureDeclaration(node);
        break;
      case "AssignmentStatement":
        this.processAssignmentStatement(node);
        break;
      case "ProcedureCall":
        this.processProcedureCall(node);
        break;
      case "IfStatement":
        this.processIfStatement(node);
        break;
      case "WhileStatement":
        this.processWhileStatement(node);
        break;
      case "ForStatement":
        this.processForStatement(node);
        break;
      case "ReadStatement":
        this.processReadStatement(node);
        break;
      case "WriteStatement":
        this.processWriteStatement(node);
        break;
      case "BinaryExpression":
        this.processBinaryExpression(node);
        break;
      default:
        console.warn(`Unhandled node type: ${node.type}`);
    }
  },
  processChildren(node) {
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => this.processNode(child));
    }
  },

  processStatements(statements) {
    statements.forEach((statement) => this.processNode(statement));
  },

  processDeclaration(node) {
    node.children.forEach((decl) => {
      const name = decl.name;
      if (this.symbolTable[name]) {
        throw new Error(`Variable ${name} is already declared.`);
      }
      this.symbolTable[name] = { type: decl.type, value: null }; // 声明变量，默认值为null
    });
  },

  processProcedureDeclaration(node) {
    const name = node.name;
    if (this.symbolTable[name]) {
      throw new Error(`Procedure ${name} is already declared.`);
    }
    this.symbolTable[name] = {
      type: "Procedure",
      parameters: [],
      body: node.body,
    };
    // 这里可以递归分析过程体，以处理局部变量等
  },

  processAssignmentStatement(node) {
    const name = node.identifier;
    if (!this.symbolTable[name]) {
      throw new Error(`Variable ${name} is not declared.`);
    }
    // 这里可以对赋值表达式进行分析，暂略
  },

  processProcedureCall(node) {
    const name = node.name;
    if (
      !this.symbolTable[name] ||
      this.symbolTable[name].type !== "Procedure"
    ) {
      throw new Error(`Procedure ${name} is not declared.`);
    }
    // 对过程调用进行分析，这里简化处理，实际中可能需要检查参数
  },

  processIfStatement(node) {
    // 分析条件表达式，这里简化处理
    this.processNode(node.condition);
    this.processNode(node.thenStatement);
    if (node.elseStatement) {
      this.processNode(node.elseStatement);
    }
  },

  processWhileStatement(node) {
    // 分析条件表达式和循环体
    this.processNode(node.condition);
    this.processNode(node.doStatement);
  },

  processForStatement(node) {
    // 分析初始化、结束条件和循环体
    this.processNode(node.initialValue);
    this.processNode(node.finalValue);
    this.processNode(node.body);
  },
  processReadStatement(node) {
    const name = node.variableName;
    if (!this.symbolTable[name]) {
      throw new Error(`Read operation on undeclared variable '${name}'.`);
    }
    // 'read'操作可能需要标记变量为已使用或进行其他相关处理
  },

  processWriteStatement(node) {
    // 对于'write'语句，需要确保其表达式中的变量已声明
    this.processExpression(node.expression); // 假设已存在处理表达式的方法
  },
  processBinaryExpression(node) {
    // 处理左子节点
    this.processExpression(node.left);
    // 处理右子节点
    this.processExpression(node.right);
  },
  processExpression(expression) {
    switch (expression.type) {
      case "Identifier":
        const name = expression.name;
        if (!this.symbolTable[name]) {
          throw new Error(`Variable ${name} is not declared.`);
        }
        break;
      case "BinaryExpression":
        this.processBinaryExpression(expression);
        break;
      // 处理其他表达式类型...
    }
  },
};

module.exports = semanticAnalyzer;
