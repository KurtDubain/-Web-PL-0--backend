// 目标代码生成器
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
      let [operation, operand1, operand2, operand3] = instruction.split(" ");
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
              watCode.push(`  (global $${operand1} (mut i32) (i32.const 0))`);
              globalVars.add(operand1);
            }
          }
          break;
        case "CONST":
          if (!localVars.has(operand1)) {
            watCode.push(`  (global $${operand1} (mut i32) (i32.const 0))`);
            localVars.add(operand1);
          }
          if (operation === "CONST") {
            procedureCode[currentProcedure].push(`    (i32.const ${operand3})`);
            procedureCode[currentProcedure].push(
              `    (global.set $${operand1})`
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
                watCode.push(
                  `    (global $${varName} (mut i32) (i32.const 0))`
                );
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
            null,
            null,
            procedureCode[currentProcedure]
          );
          break;
        case "WHILE":
        case "ENDWHILE":
        case "DO":
        case "FOR":
        case "ENDFOR":
          // 处理循环语句
          if (operand1 != undefined || operand2 != undefined) {
            this.handleLoop(
              operation,
              operand1,
              operand2,
              procedureCode[currentProcedure]
            );
          } else {
            // 如果operand1是undefined，可能表示当前操作不需要operand，调整方法调用以反映这一点
            this.handleLoop(
              operation,
              null,
              null,
              procedureCode[currentProcedure]
            );
          }
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
    let codeLine = "";
    switch (operation) {
      case "LOAD":
        return `    (global.get $${operand1})`;
      case "STORE":
        return `    (global.set $${operand1})`;
      case "PUSH":
        return `    (i32.const ${operand1})`;
      case "CALL":
        return `    (call $${operand1})`;
      case "READ":
        return `    (call $read)\n    (global.set $${operand1})`;
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
          ">=": "i32.ge_s",
          "<=": "i32.le_s",
          "=": "i32.eq",
          "<>": "i32.ne",
          // 添加其他必要的操作符支持
        };
        if (operation === "OPER" && operators[operand1]) {
          return `    (${operators[operand1]})`;
        }
        break;
      case "INIT_LOOP_VAR":
        return `    (i32.const ${operand2})\n    (global.set $${operand1})`; // 假设operand2是初始值
      case "INCREMENT_LOOP_VAR":
        return `    (global.get $${operand1})\n    (i32.const 1)\n    (i32.add)\n    (global.set $${operand1})`;
      default:
        return "";
    }
    if (this.isInLoop) {
      // 如果当前处于循环体内，将操作代码添加到循环体操作集合中
      this.currentLoopOperations.push(codeLine);
    } else {
      // 如果当前不在循环体内，将操作代码直接添加到当前过程的代码中
      this.procedureCode[this.currentProcedure].push(codeLine);
    }
  },
  // 条件句处理
  handleCondition(operation, operand1, operand2, procedureCode) {
    // 使用栈来追踪嵌套的if-else结构
    if (!this.conditionStack) {
      this.conditionStack = [];
    }

    switch (operation) {
      case "IF":
        // 开始新的if条件
        procedureCode.push(`    (if  (then`); // 条件表达式应该在此之前被评估
        this.conditionStack.push("IF");
        break;
      case "ELSEIF":
        // 结束前一个if或elseif块，并开始一个新的elseif块
        // procedureCode.push(`    )`);
        procedureCode.splice(
          procedureCode.length - 3,
          0,
          `     )\n      (else`
        );
        this.conditionStack.push("ELSEIF"); // 移除上一个IF或ELSEIF
        procedureCode.push(`    (if  (then`); // ELSEIF作为新的if开始
        // this.conditionStack.push("IF");
        break;
      case "ELSE":
        // 开始else块
        procedureCode.push(`    )\n    (else`);
        // this.conditionStack.pop(); // 移除上一个IF或ELSEIF
        // if (this.conditionStack[this.conditionStack.length - 1] === "IF") {
        //   this.conditionStack.pop();
        // }
        // this.conditionStack.push("ELSE")
        this.conditionStack.push("ELSE");
        break;
      case "ENDIF":
        // 结束当前的if或else块
        while (this.conditionStack.length > 0) {
          let cond = this.conditionStack.pop();
          // procedureCode.push("    )\n     )\n"); // 对于IF，添加结束标记，ELSE不需要
          if (cond === "ELSE" || cond === "IF") {
            procedureCode.push("    )\n");
          } else if (cond === "ELSEIF") {
            procedureCode.push("    )\n     )\n");
          }
        }
        break;
    }
  },
  // 循环体处理
  handleLoop(operation, operand1, operand2, procedureCode) {
    let labelInfo;
    // console.log(operand);
    switch (operation) {
      case "FOR":
        // this.isInLoop = true; // 标记进入循环体
        // this.currentLoopOperations = []; // 初始化循环体操作集合
        if (operand2 == "INIT") {
          labelInfo = {
            start: this.generateLabel(),
            end: this.generateLabel(),
            var: operand1,
          };
          this.loopLabelsStack.push(labelInfo);
          procedureCode.push(`    (global.set $${operand1})`);
          procedureCode.push(`    (block $${labelInfo.end}`);
          procedureCode.push(`      (loop $${labelInfo.start}`);
          procedureCode.push(`      (global.get $${operand1})`);
        } else if (operand2 == "TO") {
          labelInfo = this.loopLabelsStack.pop();
          this.loopLabelsStack.push(labelInfo);
          procedureCode.push(`      (i32.lt_s)`);
          procedureCode.push(`      (i32.eqz)`);
          procedureCode.push(`      (br_if $${labelInfo.end})`);
        }

        break;
      case "ENDFOR":
        labelInfo = this.loopLabelsStack.pop();
        // 将循环体内的操作插入到 procedureCode

        // 添加比较循环变量和结束条件，决定是否跳出循环
        procedureCode.push(`        (global.get $${labelInfo.var})`);
        procedureCode.push(`        (i32.const 1)`);
        procedureCode.push(`        (i32.add)`);
        procedureCode.push(`        (global.set $${labelInfo.var})`);
        // procedureCode.push(`        (br_if $${labelInfo.end})`);

        procedureCode.push(`        br $${labelInfo.start}`);
        procedureCode.push(`      )`);
        procedureCode.push(`    )`);
        break;
      case "WHILE":
        // 标记进入循环体
        labelInfo = {
          start: this.generateLabel(),
          condition: this.generateLabel(), // 新增：循环条件检查标签
          end: this.generateLabel(),
        };

        this.loopLabelsStack.push(labelInfo);
        // 开始循环，首先跳转到条件检查
        procedureCode.push(`    (block $${labelInfo.end}`); // 循环终止的外层块

        procedureCode.push(`      (loop $${labelInfo.start}`); // 实际循环开始的地方
        // 首次进入循环，跳转到条件检查
        break;
      case "DO":
        // 循环体开始前的条件检查，因为'WHILE'后立即是条件
        const currentLabelInfo =
          this.loopLabelsStack[this.loopLabelsStack.length - 1];
        procedureCode.push(`        (i32.eqz)`);

        procedureCode.push(`        (br_if $${currentLabelInfo.end})`); // 如果条件不满足，则跳出循环
        break;
      case "ENDWHILE":
        if (this.loopLabelsStack.length > 0) {
          labelInfo = this.loopLabelsStack.pop();
        } else {
          throw new Error("Mismatched WHILE-ENDWHILE structure.");
        }

        // 这里应该已经包含了循环体内的所有操作
        // 循环条件检查在循环体之后进行
        procedureCode.push(`        (block $${labelInfo.condition}`); // 条件检查块

        // 注意：这里假设循环条件已经在循环开始处被评估
        // 如果条件满足，使用br_if跳回循环开始
        procedureCode.push(`          (br $${labelInfo.start})`);
        procedureCode.push(`        )`); // 结束条件检查块

        procedureCode.push(`      )`); // 结束循环开始的块
        procedureCode.push(`    )`); // 结束循环结束的块
        break;
    }
  },
};

module.exports = targetCodeGenerator;
