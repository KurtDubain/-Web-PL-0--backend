// src/websocketService.js
const socketIo = require("socket.io");
const compilerModel = require("../models/compilerModel");
const inspector = require("inspector");
// const cors = require("@koa/cors");
// const session = new inspector.Session();
// session.connect();
const readWriteMethods = `
function read(varName) {
  // 假定为每个读取操作返回2
  global[varName] = 2;
}

function write(value) {
  console.log(value);
}
`;
class DebugSession {
  constructor(socket) {
    this.socket = socket;
    this.session = new inspector.Session(); // 将session实例化移到构造函数内部
    this.session.connect();
    this.scriptId = null;
    this.compiledJSCode = null;
    this.lineMapping = {};
    this.symbolTable = {};
    this.varNames = [];

    this.socket.on("disconnect", () => {
      console.log("Client disconnected");
      this.session.disconnect();
    });

    this.session.on("Debugger.paused", async (message) => {
      const { params } = message;
      const currentCallFrame = params.callFrames[0];
      const jsLine = currentCallFrame.location.lineNumber + 1; // 从0开始计数，所以+1得到实际的行号
      // 找到PL/0对应的行号
      const pl0Line = Object.keys(this.lineMapping).find(
        (key) => this.lineMapping[key] === jsLine
      );

      // 收集作用域内的所有变量
      let variables = [];
      for (const scope of currentCallFrame.scopeChain) {
        if (scope.object) {
          try {
            const { result: properties } = await new Promise(
              (resolve, reject) => {
                this.session.post(
                  "Runtime.getProperties",
                  { objectId: scope.object.objectId },
                  (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                  }
                );
              }
            );

            // 过滤并收集指定变量
            variables = properties
              .filter((property) => this.varNames.includes(property.name))
              .map((property) => ({
                name: property.name,
                value: property.value.value || property.value.description,
              }));
          } catch (err) {
            console.error("Failed to get properties:", err);
          }
        }
      }

      // 现在你有了PL/0行号，可以将其发送给前端
      socket.emit("paused", {
        variables,
        pl0Line: pl0Line, // 发送PL/0行号
      });
      // this.session.post("Debugger.pause", (err, res) => {
      //   if (err) {
      //     console.error("Failed to pause:", err);
      //   } else {
      //     console.log("Paused successfully", res);
      //   }
      // });
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
    this.compiledJSCode = this.compiledJSCode + readWriteMethods;
    this.lineMapping = generateLineMapping(code, this.compiledJSCode);
    this.symbolTable = await compilerModel.performSemanticAnalysis(code);
    this.varNames = extractVariableNames(this.symbolTable);
    // console.log(this.symbolTable);
    this.session.post("Debugger.enable");
    this.session.post("Runtime.enable");

    // 先编译脚本
    this.compileScript(() => {
      console.log(21);
      // 设置好所有断点后再执行脚本
      this.setBreakpoints(breakpoints, () => {
        this.runScript();
      });
    });
  }

  compileScript(callback) {
    this.session.post(
      "Runtime.compileScript",
      {
        expression: this.compiledJSCode,
        sourceURL: "input.js",
        persistScript: true,
      },
      (err, res) => {
        if (err) {
          console.error("Compile script failed:", err);
          return;
        }
        this.scriptId = res.scriptId;
        if (callback) callback();
      }
    );
  }

  setBreakpoints(breakpoints, callback) {
    let breakpointsSet = 0;
    breakpoints.forEach((pl0Line) => {
      const jsLine =
        this.lineMapping[pl0Line] ||
        findClosestJsLine(pl0Line, this.lineMapping);
      if (jsLine) {
        this.session.post(
          "Debugger.setBreakpoint",
          {
            location: {
              scriptId: this.scriptId,
              lineNumber: jsLine - 1,
            },
          },
          (err, response) => {
            if (err) {
              console.error("Failed to set breakpoint:", err);
            } else {
              console.log("Breakpoint set successfully, response:", response);
            }
            breakpointsSet++;
            // 确保所有断点都设置完成后再回调
            if (breakpointsSet === breakpoints.length && callback) {
              callback();
            }
          }
        );
      }
    });
  }

  runScript() {
    // 这里只有在设置完断点后才执行脚本
    this.session.post(
      "Runtime.runScript",
      { scriptId: this.scriptId },
      (err, res) => {
        if (err) {
          console.error("Run script failed:", err);
        } else {
          console.log("Script executed successfully, response:", res);
        }
      }
    );
  }

  continue() {
    console.log("Executing continue command...");
    this.session.post("Debugger.resume", (err, response) => {
      if (err) {
        console.error("Failed to execute Debugger.resume command:", err);
      } else {
        console.log("Successfully executed Debugger.resume command.", response);
        // response对象通常包含了执行结果的详细信息，具体内容取决于调试器和命令本身
      }
    });
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
      // console.log(code, breakpoints);
      await debugSession.initializeDebugSession(code.content, breakpoints);
    });

    socket.on("debugCommand", (data) => {
      const { command } = data;
      const session = debugSessions.get(socket.id);
      if (session) {
        switch (command) {
          case "continue":
            console.log("continue");
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
function extractVariableNames(symbolTable) {
  let variableNames = [];
  for (const [key, value] of Object.entries(symbolTable)) {
    if (value.type === "VarDeclaration" || value.type === "ConstDeclaration") {
      variableNames.push(key);
    }
    // 如果还有嵌套的符号表，可以在这里递归调用extractVariableNames
  }
  return variableNames;
}

module.exports = startWebSocketServer;
