// src/websocketService.js
const socketIo = require("socket.io");
const inspector = require("inspector");
const session = new inspector.Session();
session.connect();

class DebugSession {
  constructor(socket) {
    this.socket = socket;
    this.session = session;
    this.scriptId = null;

    this.socket.on("disconnect", () => {
      console.log("Client disconnected");
      this.session.disconnect();
    });

    this.session.on("Debugger.paused", (message) => {
      const { params } = message;
      // 向客户端发送暂停事件和当前调试信息
      socket.emit("paused", params);
    });

    this.session.on("Debugger.scriptParsed", (message) => {
      const { params } = message;
      this.scriptId = params.scriptId; // 保存scriptId用于后续的断点设置
    });
  }

  async initializeDebugSession(code, breakpoints) {
    this.session.post("Debugger.enable");
    this.session.post("Runtime.enable");

    // 编译并运行代码
    this.session.post(
      "Runtime.compileScript",
      {
        expression: code,
        sourceURL: "input.js", // 给代码一个虚拟的URL
        persistScript: true,
      },
      (err, { scriptId }) => {
        if (err) {
          console.error("Compile script failed:", err);
          return;
        }
        this.session.post("Runtime.runScript", { scriptId });
      }
    );

    // 设置断点
    breakpoints.forEach((line) => {
      this.session.post("Debugger.setBreakpoint", {
        location: { scriptId: this.scriptId, lineNumber: line - 1 }, // inspector API中行号是从0开始的
      });
    });
  }

  continue() {
    this.session.post("Debugger.resume");
  }

  stepOver() {
    this.session.post("Debugger.stepOver");
  }
}

const startWebSocketServer = (server) => {
  const io = socketIo(server);
  const debugSessions = new Map();

  io.on("connection", (socket) => {
    console.log("Socket.io client connected");

    const debugSession = new DebugSession(socket);
    debugSessions.set(socket.id, debugSession);

    socket.on("initialize", async (data) => {
      const { code, breakpoints } = data;
      await debugSession.initializeDebugSession(code, breakpoints);
    });

    socket.on("debugCommand", (data) => {
      const { command } = data;
      const session = debugSessions.get(socket.id);
      if (session) {
        switch (command) {
          case "continue":
            session.continue();
            break;
          case "stepOver":
            session.stepOver();
            break;
        }
      }
    });

    socket.on("disconnect", () => {
      debugSessions.delete(socket.id);
      console.log("Socket disconnected and session removed.");
    });
  });

  console.log("WebSocket server started.");
};

module.exports = startWebSocketServer;
