const compilerModel = require("../models/compilerModel");
const inspector = require("inspector");

// 声明read和write方法
const readWriteMethods = `
function read(varName) {
  // 假定为每个读取操作返回2
  varname = 2;
}

function write(value) {
  console.log(value);
}
`;
class DebugSession {
  constructor(socket) {
    this.socket = socket; // 初始化webSocket链接
    this.session = new inspector.Session(); // 将session实例化移到构造函数内部
    this.session.connect();
    this.scriptId = null;
    this.compiledJSCode = null; //JS目标代码
    this.lineMapping = {}; // 行号映射表
    this.symbolTable = {}; // 符号表
    this.varNames = []; // 处理过后的符号表（变量信息）

    this.socket.on("disconnect", async () => {
      // console.log("和客户端连接");
      for (const key of this.varNames) {
        await new Promise((resolve, reject) => {
          this.session.post(
            "Runtime.evaluate",
            { expression: `${key.varName} = null;` },
            (err, result) => {
              if (err) {
                console.error(`重置变量 ${key.varName}:失败，`, err);
                reject(err); // 处理错误
              } else {
                // console.log(`${varName}变量成功重置`);
                resolve(); // 正确解析
              }
            }
          );
        }).catch((err) => console.error(err));
      }
      this.session.disconnect();
    });
    // 断点触发的回调事件
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
              .filter((property) =>
                this.varNames.some((v) => v.varName === property.name)
              )
              .map((property) => {
                const varInfo = this.varNames.find(
                  (v) => v.varName === property.name
                );
                return {
                  name: property.name,
                  value: property.value.value || property.value.description,
                  type: varInfo ? varInfo.type : undefined,
                  scope: "Global", // 目前全部是全局变量
                };
              });
          } catch (err) {
            console.error("收集变量异常:", err);
          }
        }
      }

      // 现在有了PL/0行号，可以将其发送给前端
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
  // 初始化功能
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
      // console.log(21);
      // 设置好所有断点后再执行脚本
      this.setBreakpoints(breakpoints, () => {
        this.runScript();
      });
    });
  }
  // 编译处理
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
          console.error("编译脚本异常:", err);
          return;
        }
        this.scriptId = res.scriptId;
        if (callback) callback();
      }
    );
  }
  // 编译通过后，设置断点
  setBreakpoints(breakpoints, callback) {
    let breakpointsSet = 0;
    // 根据映射关系设置断点
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
              console.error("设置断点失败:", err);
            } else {
              // console.log("Breakpoint set successfully, response:", response);
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
  // 设置断点之后，执行代码
  runScript() {
    // 这里只有在设置完断点后才执行脚本
    this.session.post(
      "Runtime.runScript",
      { scriptId: this.scriptId },
      (err, res) => {
        if (err) {
          console.error("执行脚本失败:", err);
        } else {
          // console.log("Script executed successfully, response:", res);
        }
      }
    );
  }
  // 继续执行
  continue() {
    // console.log("Executing continue command...");
    this.session.post("Debugger.resume", (err, response) => {
      if (err) {
        console.error("执行恢复执行指令失败:", err);
      } else {
        console.log("成功执行恢复指令.", response);
        // response对象通常包含了执行结果的详细信息，具体内容取决于调试器和命令本身
      }
    });
  }
  // 单步执行
  stepOver() {
    this.session.post("Debugger.stepOver");
  }
}

// 建立pl0代码和js的映射关系
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
// 用于找到离当前节点最近的存在映射关系的js点
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
// 用于提取符号表的变量和常量
function extractVariableNames(symbolTable) {
  let variableNames = [];
  for (const [key, value] of Object.entries(symbolTable)) {
    if (value.type === "VarDeclaration" || value.type === "ConstDeclaration") {
      variableNames.push({
        varName: key,
        type:
          value.type === "VarDeclaration"
            ? "VarDeclaration"
            : "ConstDeclaration",
      });
    }
  }
  return variableNames;
}
module.exports = DebugSession;
