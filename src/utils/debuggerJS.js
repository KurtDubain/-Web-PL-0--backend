const vm = require("vm");
const EventEmitter = require("events");

class DebugSession extends EventEmitter {
  constructor(socket) {
    super();
    this.socket = socket;
    this.breakpoints = []; // 存储断点信息
    this.currentLine = 0; // 当前执行到的代码行数
    this.vmContext = vm.createContext({
      console: console,
      debug: this.debug.bind(this), // 在VM上下文中绑定debug函数
    });
    this.loadVariablesIntoContext();
  }

  // 初始化调试会话，插入debug函数到断点位置
  initializeDebugSession(code, breakpoints) {
    this.breakpoints = breakpoints.sort((a, b) => a - b); // 确保断点按行号排序
    let lines = code.split("\n"); // 分割代码为行数组

    // 插入debug函数
    this.breakpoints.forEach((breakpoint) => {
      let index = breakpoint - 1; // 转换行号为数组索引
      lines.splice(index, 0, `debug(${breakpoint});`);
    });

    let modifiedCode = lines.join("\n");
    this.execute(modifiedCode);
  }
  loadVariablesIntoContext() {
    // 将所有变量初始化到 VM 上下文中
    this.variableNames.forEach((varName) => {
      this.vmContext[varName] = undefined;
    });
  }

  // debug函数，用于在VM中断点处调用
  debug(line) {
    if (this.breakpoints.includes(line)) {
      this.currentLine = line;
      // 捕获所有变量的值
      const variableValues = this.variableNames.reduce((acc, varName) => {
        acc[varName] = this.vmContext[varName];
        return acc;
      }, {});

      // 向客户端发送断点和变量信息
      this.socket.emit("debugBreak", { line, variableValues });
    }
  }

  // 执行处理后的代码
  execute(code) {
    try {
      vm.runInContext(code, this.vmContext);
      // 代码执行完毕后通知客户端
      this.socket.emit("executionFinished");
    } catch (err) {
      // 错误处理，通知客户端执行出错
      this.socket.emit("executionError", { message: err.message });
    }
  }

  // 单步执行
  stepOver() {
    // 在当前行后插入一次debug调用，并执行代码
    // 注意：这需要你能够动态修改正在执行的代码，或者以其他方式实现单步执行的效果
  }

  // 继续执行到下一个断点
  continue() {
    // 从当前行继续执行，直到遇到下一个断点
    // 类似于stepOver，这需要特殊处理以支持动态执行控制
  }
}

module.exports = DebugSession;
