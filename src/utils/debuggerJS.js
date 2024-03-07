const vm = require("vm");
const EventEmitter = require("events");

class DebugSession extends EventEmitter {
  constructor(socket) {
    super();
    this.socket = socket;
    this.breakpoints = [];
    this.currentLine = null;
    // 创建一个新的VM上下文
    this.vmContext = vm.createContext({
      console: console, // 将console对象传入VM上下文，以便在代码中使用console.log等
      // 定义其他可能需要的全局变量和函数
    });

    // 监听来自客户端的调试指令
    this.on("setBreakpoints", this.setBreakpoints.bind(this));
    this.on("execute", this.execute.bind(this));
    // 监听其他调试事件...
  }

  setBreakpoints(breakpoints) {
    this.breakpoints = breakpoints;
    // 可以在这里处理断点设置相关逻辑
  }

  setCurrentLine(line) {
    this.currentLine = line;
    this.socket.emit("currentLine", { line }); // 通知客户端当前执行位置
  }

  execute(code) {
    try {
      // 使用vm执行代码
      vm.runInContext(code, this.vmContext);
      // 代码执行完毕后通知客户端
      this.socket.emit("executionFinished");
    } catch (err) {
      // 错误处理，通知客户端执行出错
      this.socket.emit("executionError", { message: err.message });
    }
  }

  // 实现其他调试控制方法，比如单步执行、继续执行到下一个断点等

  stepOver() {
    // 实现单步执行逻辑
  }

  continue() {
    // 实现继续执行到下一个断点的逻辑
  }
}

module.exports = DebugSession;
