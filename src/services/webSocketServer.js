// src/websocketService.js
// webSocket服务
const socketIo = require("socket.io");
const DebugSession = require("../utils/debuggerJS");
// 启动webSocket
const startWebSocketServer = (server) => {
  const io = socketIo(server, {
    cors: {
      // origin: "http://localhost:8080",
      origin: "https://www.dyp02.vip:8443",
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"],
      credentials: true,
    },
    pingInterval: 100000, // 每10秒发送一次心跳包
    pingTimeout: 500,
  });
  const debugSessions = new Map();

  io.on("connection", (socket) => {
    console.log("客户端调试模式已连接");

    const debugSession = new DebugSession(socket);
    debugSessions.set(socket.id, debugSession);

    socket.on("init", async (data) => {
      const { code, breakpoints } = data;
      // console.log(code, breakpoints);
      await debugSession.initializeDebugSession(code.content, breakpoints);
    });
    // 接受调试命令
    socket.on("debugCommand", (data) => {
      const { command } = data;
      const session = debugSessions.get(socket.id);
      if (session) {
        switch (command) {
          case "continue":
            // console.log("continue");
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
      console.log("调试连接已断开.");
    });
  });

  console.log("webSocket服务已开启.");
};

module.exports = startWebSocketServer;
