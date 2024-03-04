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

  // 其他调试操作，如查看/修改变量值等
}
module.exports = Debugger;
