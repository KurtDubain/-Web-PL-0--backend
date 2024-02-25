const targetCodeGenerator = {
  labelCounter: 0,
  loopLabelsStack: [],
  isInLoop: false, // 追踪是否处于循环体内
  currentLoopOperations: [], // 用于收集当前循环体内的操作

  generateLabel() {
    return `label${this.labelCounter++}`;
  },

  generateWAT(intermediateCode) {
    let watCode = [
      "(module",
      '  (import "js" "log" (func $log (param i32)))', // 日志函数
      '  (import "js" "read" (func $read (result i32)))', // 读取函数
    ];

    let currentProcedure = "$main"; // 当前处理的过程，默认为主过程
    let procedureCode = { $main: [] }; // 存储过程代码
    let localVars = new Set(); // 存储局部变量
    let globalVars = new Set();

    intermediateCode.forEach((instruction) => {
      let [operation, operand1, operand2] = instruction.split(" ");
      let codeLine = "";

      switch (operation) {
        case "DECLARE":
          if (currentProcedure !== "$main") {
            // 初始化局部变量集合（如果还未初始化）
            if (!localVars[currentProcedure]) {
              localVars[currentProcedure] = new Set();
            }
            // 添加变量到当前过程的局部变量集合
            localVars[currentProcedure].add(operand1);
          } else {
            // 全局变量的处理逻辑
            if (!globalVars.has(operand1)) {
              watCode.push(`  (local $${operand1} i32)`);
              globalVars.add(operand1);
            }
          }
          break;
        case "CONST":
          if (!localVars.has(operand1)) {
            watCode.push(`  (local $${operand1} i32)`);
            localVars.add(operand1);
          }
          if (operation === "CONST") {
            procedureCode[currentProcedure].push(`    (i32.const ${operand2})`);
            procedureCode[currentProcedure].push(
              `    (set_local $${operand1})`
            );
          }
          break;
        case "LOAD":
        case "STORE":
        case "PUSH":
        case "CALL":
        case "READ":
        case "WRITE":
        case "OPER":
        case "INIT_LOOP_VAR":
        case "INCREMENT_LOOP_VAR":
          // 直接处理这些操作，将相应的WAT代码添加到当前过程
          codeLine = this.handleOperation(operation, operand1, operand2);
          procedureCode[currentProcedure].push(codeLine);
          break;
        case "PROCEDURE":
          if (operand2 === "START") {
            currentProcedure = `$${operand1}`;
            procedureCode[currentProcedure] = []; // 初始化新过程的代码数组
          } else {
            // 结束当前过程，生成WAT代码
            watCode.push(`  (func ${currentProcedure} (export "${operand1}")`);
            if (localVars[currentProcedure]) {
              localVars[currentProcedure].forEach((varName) => {
                watCode.push(`    (local $${varName} i32)`);
              });
            }
            watCode = watCode.concat(procedureCode[currentProcedure]);
            watCode.push("  )");
            currentProcedure = "$main"; // 回到主过程
          }
          break;
        case "IF":
        case "ELSEIF":
        case "ELSE":
        case "ENDIF":
          // 处理条件语句
          // codeLine = this.handleCondition(operation, operand1, operand2);
          // procedureCode[currentProcedure].push(codeLine);
          this.handleCondition(
            operation,
            operand1,
            operand2,
            procedureCode[currentProcedure]
          );
          break;
        case "WHILE":
        case "ENDWHILE":
        case "FOR":
        case "ENDFOR":
          // 处理循环语句
          this.handleLoop(operation, operand1, procedureCode[currentProcedure]);
          break;
      }
    });

    // 如果主过程有代码，则生成主过程的WAT代码
    if (procedureCode["$main"].length > 0) {
      watCode.push('  (func $main (export "main")');
      watCode = watCode.concat(procedureCode["$main"]);
      watCode.push("  )");
    }

    watCode.push(")"); // 结束模块
    return watCode.join("\n");
  },

  handleOperation(operation, operand1, operand2) {
    // 根据操作生成相应的WAT代码行
    switch (operation) {
      case "LOAD":
        return `    (get_local $${operand1})`;
      case "STORE":
        return `    (set_local $${operand1})`;
      case "PUSH":
        return `    (i32.const ${operand1})`;
      case "CALL":
        return `    (call $${operand1})`;
      case "READ":
        return `    (call $read)\n    (set_local $${operand1})`;
      case "WRITE":
        return `    (call $log)`;
      case "OPER":
        const operators = {
          ">": "i32.gt_s",
          "<": "i32.lt_s",
          "+": "i32.add",
          "-": "i32.sub",
          "*": "i32.mul",
          "/": "i32.div_s",
          // 添加其他必要的操作符支持
        };
        if (operation === "OPER" && operators[operand1]) {
          return `    (${operators[operand1]})`;
        }
        break;
      case "INIT_LOOP_VAR":
        return `    (i32.const ${operand2})\n    (set_local $${operand1})`; // 假设operand2是初始值
      case "INCREMENT_LOOP_VAR":
        return `    (get_local $${operand1})\n    (i32.const 1)\n    (i32.add)\n    (set_local $${operand1})`;
      default:
        return "";
    }
  },

  handleCondition(operation, operand1, operand2, procedureCode) {
    // 根据条件语句操作生成相应的WAT代码行
    switch (operation) {
      case "IF":
        procedureCode.push(`    (if (result i32)`); // 开始 if 条件
        // 条件本身应该在调用 handleCondition 之前被处理
        break;
      case "ELSEIF":
        // WAT 不直接支持 ELSEIF，需要用嵌套的 if 来模拟
        procedureCode.push(`    )`); // 结束上一个 if 或 else-if 块
        procedureCode.push(`    (else (if (result i32)`); // 开始 else-if 条件
        // 条件本身应该在调用 handleCondition 之前被处理
        break;
      case "ELSE":
        procedureCode.push(`    (else`); // 开始 else 分支
        break;
      case "ENDIF":
        procedureCode.push("    )"); // 结束if或else块
        if (operation === "ELSEIF" || operation === "ELSE") {
          procedureCode.push("  )"); // 如果是ELSEIF或ELSE，需要额外结束外层的else块
        }
        break;
      default:
        return "";
    }
  },

  handleLoop(operation, operand, procedureCode) {
    let labelInfo;
    switch (operation) {
      case "WHILE":
      case "FOR":
        isInLoop = true; // 标记进入循环体
        currentLoopOperations = []; // 初始化循环体操作集合
        labelInfo = { start: this.generateLabel(), end: this.generateLabel() };
        this.loopLabelsStack.push(labelInfo);
        procedureCode.push(`    (block $${labelInfo.end}`);
        procedureCode.push(`      (loop $${labelInfo.start}`);
        break;
      case "ENDWHILE":
      case "ENDFOR":
        isInLoop = false; // 标记离开循环体
        labelInfo = this.loopLabelsStack.pop();
        // 将循环体内的操作插入到 procedureCode
        currentLoopOperations.forEach((op) => procedureCode.push(op));
        currentLoopOperations = []; // 清空循环体操作集合
        procedureCode.push(`        br $${labelInfo.start}`);
        procedureCode.push(`      )`);
        procedureCode.push(`    )`);
        break;
    }
  },
};

module.exports = targetCodeGenerator;
