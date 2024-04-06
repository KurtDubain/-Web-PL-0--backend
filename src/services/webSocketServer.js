// src/websocketService.js
const socketIo = require("socket.io");
const compilerModel = require("../models/compilerModel");
const inspector = require("inspector");
const cors = require("@koa/cors");
const session = new inspector.Session();
session.connect();

class DebugSession {
  constructor(socket) {
    this.socket = socket;
    this.session = session;
    this.scriptId = null;
    this.compiledJSCode = null;
    this.lineMapping = {};

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
    this.compiledJSCode = await compilerModel.performTargetJSCodeGeneration(
      code
    );
    this.lineMapping = generateLineMapping(code, this.compiledJSCode);
    this.session.post("Debugger.enable");
    this.session.post("Runtime.enable");

    // 编译并运行代码
    this.session.post(
      "Runtime.compileScript",
      {
        expression: this.compiledJSCode,
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
    breakpoints.forEach((pl0Line) => {
      // 使用行号映射将PL/0的行号转换为JS的行号
      const jsLine = this.lineMapping[pl0Line];
      if (jsLine !== undefined) {
        this.session.post("Debugger.setBreakpoint", {
          location: {
            scriptId: this.scriptId,
            lineNumber: jsLine - 1, // inspector API中行号是从0开始的
          },
        });
      }
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
  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:8080",
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"],
      credentials: true,
    },
    pingInterval: 1000, // 每10秒发送一次心跳包
    pingTimeout: 500,
  });
  const debugSessions = new Map();

  io.on("connection", (socket) => {
    console.log("Socket.io client connected");

    const debugSession = new DebugSession(socket);
    debugSessions.set(socket.id, debugSession);

    socket.on("init", async (data) => {
      const { code, breakpoints } = data;
      console.log(code, breakpoints);
      await debugSession.initializeDebugSession(code.content, breakpoints);
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

function generateLineMapping(pl0Code, jsCode) {
  const jsLines = jsCode.split("\n");
  const mapping = {};

  jsLines.forEach((line, index) => {
    if (line.includes("//")) {
      const commentPart = line.split("//")[1].trim();
      const pl0LineNumber = parseInt(commentPart, 10);
      if (!isNaN(pl0LineNumber)) {
        mapping[pl0LineNumber] = index + 1;
      }
    }
  });

  return mapping;
}
function findClosestJsLine(pl0Line, lineMapping) {
  if (lineMapping[pl0Line]) {
    return lineMapping[pl0Line];
  } else {
    // 如果直接找不到，寻找最近的前一个有效行
    let closestLine = null;
    Object.keys(lineMapping).forEach((mappedLine) => {
      const mappedLineInt = parseInt(mappedLine, 10);
      if (mappedLineInt < pl0Line) {
        closestLine = mappedLineInt;
      }
    });

    return closestLine ? lineMapping[closestLine] : null;
  }
}
module.exports = startWebSocketServer;
