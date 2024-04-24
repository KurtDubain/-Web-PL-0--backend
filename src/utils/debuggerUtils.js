// WASM的调试功能（只适用于简单情况）
class Debugger {
  constructor() {
    this.breakpoints = new Set(); // 存储断点的行号
    this.sourceMap = {}; // 源代码映射表
    this.symbolTable = {}; // 从语义分析器获取的符号表
    this.currentLine = 0; // 当前执行到的代码行
    this.stack = []; // 变量栈
    this.intermediateCode = []; // 中间代码
    this.procedures = {}; //函数信息
  }
  // 初始化符号表
  loadSymbolTable(symbolTable) {
    this.symbolTable = symbolTable;
  }
  // 格式化符号表
  getVariablesInitValues(symbolTable = this.symbolTable, scope = "global") {
    let variablesInitValues = [];
    // console.log(symbolTable);
    Object.entries(symbolTable).forEach(([name, info]) => {
      if (info.type === "VarDeclaration" || info.type === "ConstDeclaration") {
        // 直接处理变量和常量声明
        variablesInitValues.push({
          name,
          type: info.type,
          value: info.value, // 变量或常量的初始化值
          scope, // 当前作用域
        });
      } else if (info.type === "Procedure") {
        // 对于过程，递归处理其体内的变量
        const procedureScope = `procedure:${name}`; // 定义过程作用域的标识
        const procedureVariables = this.getVariablesInitValues(
          info.body.symbolTable || {},
          procedureScope
        );
        variablesInitValues = variablesInitValues.concat(procedureVariables);
      }
      // 可以根据需要处理其他类型
    });
    return variablesInitValues;
  }
  // 初始化调试信息
  loadDebugInfo(breakPoints, intermediateCode) {
    this.breakpoints.add(breakPoints);
    this.intermediateCode = intermediateCode;
  }
  // 执行调试中的代码
  executeCodeItem(item) {
    const { code, line } = item;
    const parts = code.split(" ");
    const instruction = parts[0];
    const operands = parts.slice(1);

    switch (instruction) {
      case "DECLARE":
        // 初始化变量
        this.symbolTable[operands[0]] = { type: "VarDeclaration", value: null };
        break;
      case "PUSH":
        // 压栈
        this.stack.push(parseInt(operands[0], 10));
        break;
      case "STORE":
        // 存储变量值
        this.symbolTable[operands[0]].value = this.stack.pop();
        break;
      case "LOAD":
        // 加载变量值到栈
        this.stack.push(this.symbolTable[operands[0]].value);
        break;
      case "OPER":
        // 执行运算
        this.executeOperation(operands[0]);
        break;
      case "IF":
      case "ELSEIF":
      case "ELSE":
      case "ENDIF":
      case "WHILE":
      case "DO":
      case "ENDWHILE":
      case "FOR":
      case "ENDFOR":
      case "PROCEDURE":
      case "CALL":
        // 特殊控制流处理
        // 注意：这里需要根据实际的控制流逻辑来实现相应的处理
        break;
      case "WRITE":
        // 模拟输出操作，这里可以打印变量值或做其他处理
        console.log("WRITE operation:", this.stack.pop());
        break;
      case "READ":
        // 模拟读入操作，这里简化处理
        console.log("READ operation: Simulating input of 1");
        this.stack.push(1);
        break;
      default:
        console.warn("Unknown instruction:", instruction);
    }
  }
  // 执行操作符
  executeOperation(operator) {
    const right = this.stack.pop();
    const left = this.stack.pop();
    switch (operator) {
      case "+":
        this.stack.push(left + right);
        break;
      case "-":
        this.stack.push(left - right);
        break;
      case "*":
        this.stack.push(left * right);
        break;
      case "/":
        this.stack.push(left / right);
        break;
      case ">":
      case "<":
      case "=":
      case "<=":
      case ">=":
      case "<>":
        // 根据实际需要处理比较运算
        break;
      default:
        console.warn("Unknown operator:", operator);
    }
  }
  // 指定到指定行
  executeToLine(debugLine) {
    // 重置状态
    this.stack = [];
    for (const varName in this.symbolTable) {
      this.symbolTable[varName].value = null;
    }

    // 模拟执行
    for (const item of this.intermediateCode) {
      if (item.line > debugLine) break;
      this.executeCodeItem(item);
    }
  }

  // 获取特定行的变量状态
  getVariableStatesAtLine(debugLine) {
    this.executeToLine(debugLine);
    return this.symbolTable;
  }
}
module.exports = Debugger;
