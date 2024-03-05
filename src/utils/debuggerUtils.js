class Debugger {
  constructor() {
    this.breakpoints = new Set(); // 存储断点的行号
    this.sourceMap = {}; // 源代码映射表
    this.symbolTable = {}; // 从语义分析器获取的符号表
    this.currentLine = 0; // 当前执行到的代码行
  }

  // 设置断点
  setBreakpoint(line) {
    this.breakpoints.add(line);
  }

  // 移除断点
  removeBreakpoint(line) {
    this.breakpoints.delete(line);
  }

  // 加载源代码映射表和符号表
  loadDebugInfo(sourceMap, symbolTable) {
    this.sourceMap = sourceMap;
    this.symbolTable = symbolTable;
  }

  // 执行到下一个断点或程序结束
  runToBreakpoint() {
    while (this.currentLine < Object.keys(this.sourceMap).length) {
      if (this.breakpoints.has(this.currentLine)) {
        console.log(`Paused at breakpoint: Line ${this.currentLine}`);
        this.showCurrentVariableStates();
        break;
      }
      this.currentLine++;
      // 执行当前行的代码
      this.executeLine(this.currentLine);
    }
  }

  // 执行单步
  step() {
    this.currentLine++;
    this.executeLine(this.currentLine);
    if (this.breakpoints.has(this.currentLine)) {
      console.log(`Paused at breakpoint: Line ${this.currentLine}`);
    }
    this.showCurrentVariableStates();
  }

  // 显示当前变量的状态
  showCurrentVariableStates() {
    console.log("Current variable states:");
    for (let [varName, varInfo] of Object.entries(this.symbolTable)) {
      console.log(`${varName}: ${varInfo.value}`);
    }
  }

  // 根据行号执行行
  executeLine(line) {
    // 这里简化处理，实际中需要根据中间代码和映射表来执行
    console.log(`Executing line ${line}`);
    // 更新变量状态等操作...
  }
  loadSemanticAnalysisResult(result) {
    // 加载变量和常量
    for (const [name, info] of Object.entries(result)) {
      if (info.type === "VarDeclaration" || info.type === "ConstDeclaration") {
        // 对变量和常量统一处理
        this.symbolTable[name] = { value: info.value ?? null }; // 使用info.value初始化，对于ConstDeclaration通常不为null
      }
      // 如果需要处理过程中的变量，可以在这里增加逻辑
    }
  }

  // 显示变量和常量的初始状态
  showInitialVariableStates() {
    console.log("Initial variable and constant states:");
    for (let [name, info] of Object.entries(this.symbolTable)) {
      console.log(`${name}: ${info.value}`);
    }
  }
  loadSymbolTable(symbolTable) {
    this.symbolTable = symbolTable;
  }
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
}
module.exports = Debugger;
