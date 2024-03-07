const socketIo = require("socket.io");
const DebugSession = require("./debugSession");

const startWebSocketServer = (server) => {
  const io = socketIo(server);
  const debugSessions = new Map(); // 用于保存每个连接的DebugSession实例

  io.on("connection", (socket) => {
    console.log("Socket.io client connected");
    // 创建一个新的DebugSession实例
    const session = new DebugSession(socket);
    debugSessions.set(socket.id, session);

    socket.on("execute", async (data) => {
      console.log("Received execute request:", data);
      // 插入调试方法
      const modifiedCode = insertDebugMethods(data.code, data.breakpoints);
      // 执行代码
      await session.execute(modifiedCode);
    });

    socket.on("debugCommand", (data) => {
      console.log("Received debug command:", data);
      const session = debugSessions.get(socket.id);
      if (!session) {
        console.error("Session not found for socket:", socket.id);
        return;
      }
      // 根据收到的指令调用DebugSession中相应的方法
      switch (data.command) {
        case "continue":
          session.continue();
          break;
        case "stepOver":
          session.stepOver();
          break;
        // 处理其他指令...
      }
    });

    socket.on("disconnect", () => {
      debugSessions.delete(socket.id);
    });
  });

  console.log("Socket.io server started.");
};

module.exports = startWebSocketServer;
