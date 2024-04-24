// 语义分析器
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
  // 变量声明
  processDeclaration(node) {
    node.children.forEach((decl) => {
      const name = decl.name;
      if (this.symbolTable[name]) {
        throw new Error(`Variable ${name} is already declared.`);
      }
      // console.log(decl.type);
      this.symbolTable[name] = {
        type: decl.type, // Variable or Const
        value: decl.value,
        isConst: decl.type === "ConstDeclaration", // 假设节点有一个kind属性标记是否为常量
      };
    });
  },
  // 过程声明
  processProcedureDeclaration(node) {
    const name = node.name;
    if (this.symbolTable[name]) {
      throw new Error(`Procedure '${name}' is already declared.`);
    }
    this.symbolTable[name] = {
      type: "Procedure",
      parameters: node.parameters,
      body: node.body,
    };
    // 可以递归处理过程体中的声明，确保局部作用域被正确处理
    this.analyze(node.body);
  },

  processAssignmentStatement(node) {
    const name = node.identifier;
    if (!this.symbolTable[name]) {
      throw new Error(`Variable '${name}' is not declared.`);
    }
    if (this.symbolTable[name].isConst) {
      throw new Error(`Cannot assign to const variable '${name}'.`);
    }
    const value = this.evaluateExpression(node.expression);
    this.symbolTable[name].value = value; // 更新变量的值
  },
  // 过程调用
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
  // 算术表达式处理
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
  // 计算表达式的值
  evaluateExpression(expression) {
    switch (expression.type) {
      case "Literal":
        return expression.value;
      case "Identifier":
        const variable = this.symbolTable[expression.name];
        if (!variable) {
          throw new Error(`Variable ${expression.name} is not declared.`);
        }
        return variable.value;
      case "BinaryExpression":
        const left = this.evaluateExpression(expression.left);
        const right = this.evaluateExpression(expression.right);
        return this.applyOperator(expression.operator, left, right);
      default:
        throw new Error(`Unsupported expression type: ${expression.type}`);
    }
  },

  // 根据操作符计算二元表达式的结果
  applyOperator(operator, left, right) {
    switch (operator) {
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        return left / right; // 注意除以零的处理
      case "<":
        return left < right;
      case "<=":
        return left <= right;
      case ">":
        return left > right;
      case ">=":
        return left >= right;
      case "==":
        return left == right; // 确保使用正确的比较
      case "!=":
        return left != right;
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  },
};

module.exports = semanticAnalyzer;
