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
    switch (node.type) {
      case 'Program':
      case 'Block':
      case 'BeginEndBlock':
        if (node.children && node.children.length > 0) {
          node.children.forEach(child => this.processNode(child));
        }
        break
      case 'Declaration':
        this.processDeclaration(node);
        break;
      case 'ProcedureDeclaration':
        this.processProcedureDeclaration(node);
        break;
      case 'AssignmentStatement':
        this.processAssignmentStatement(node);
        break;
      case 'ProcedureCall':
        this.processProcedureCall(node);
        break;
      case 'IfStatement':
        this.processIfStatement(node);
        break;
      case 'WhileStatement':
        this.processWhileStatement(node);
        break;
      case 'ForStatement':
        this.processForStatement(node);
        break;
      default:
        console.warn(`Unhandled node type: ${node.type}`);
    }
  },

  processDeclaration(node) {
    node.children.forEach(decl => {
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
    this.symbolTable[name] = { type: 'Procedure', parameters: [], body: node.body };
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
    if (!this.symbolTable[name] || this.symbolTable[name].type !== 'Procedure') {
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
    this.processNode(node.body);
  },

  processForStatement(node) {
    // 分析初始化、结束条件和循环体
    this.processNode(node.initialValue);
    this.processNode(node.finalValue);
    this.processNode(node.body);
  },
};

module.exports = semanticAnalyzer;
