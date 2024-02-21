const targetCodeGenerator = {
  labelCounter: 0,
  loopLabelsStack: [],

  generateLabel() {
    return `label${this.labelCounter++}`;
  },

  generateWAT(intermediateCode) {
    let watCode = [
      '(module',
      '  (import "js" "log" (func $log (param i32)))', // 日志函数
      '  (import "js" "read" (func $read (result i32)))', // 读取函数
    ];

    let currentProcedure = '$main'; // 当前处理的过程，默认为主过程
    let procedureCode = { '$main': [] }; // 存储过程代码
    let localVars = new Set(); // 存储局部变量

    intermediateCode.forEach(instruction => {
      let [operation, operand1, operand2] = instruction.split(' ');
      let codeLine = '';

      switch (operation) {
        case 'DECLARE':
        case 'CONST':
          if (!localVars.has(operand1)) {
            watCode.push(`  (local $${operand1} i32)`);
            localVars.add(operand1);
          }
          if (operation === 'CONST') {
            procedureCode[currentProcedure].push(`    (i32.const ${operand2})`);
            procedureCode[currentProcedure].push(`    (set_local $${operand1})`);
          }
          break;
        case 'LOAD':
        case 'STORE':
        case 'PUSH':
        case 'CALL':
        case 'READ':
        case 'WRITE':
          // 直接处理这些操作，将相应的WAT代码添加到当前过程
          codeLine = this.handleOperation(operation, operand1, operand2);
          procedureCode[currentProcedure].push(codeLine);
          break;
        case 'PROCEDURE':
          if (operand2 === 'START') {
            currentProcedure = `$${operand1}`;
            procedureCode[currentProcedure] = []; // 初始化新过程的代码数组
          } else {
            // 结束当前过程，生成WAT代码
            watCode.push(`  (func ${currentProcedure} (export "${operand1}")`);
            watCode = watCode.concat(procedureCode[currentProcedure]);
            watCode.push('  )');
            currentProcedure = '$main'; // 回到主过程
          }
          break;
        case 'IF':
        case 'ELSEIF':
        case 'ELSE':
        case 'ENDIF':
          // 处理条件语句
          codeLine = this.handleCondition(operation, operand1, operand2);
          procedureCode[currentProcedure].push(codeLine);
          break;
        case 'WHILE':
        case 'ENDWHILE':
        case 'FOR':
        case 'ENDFOR':
          // 处理循环语句
          this.handleLoop(operation, operand1, procedureCode[currentProcedure]);
          break;
      }
    });

    // 如果主过程有代码，则生成主过程的WAT代码
    if (procedureCode['$main'].length > 0) {
      watCode.push('  (func $main (export "main")');
      watCode = watCode.concat(procedureCode['$main']);
      watCode.push('  )');
    }

    watCode.push(')'); // 结束模块
    return watCode.join('\n');
  },

  handleOperation(operation, operand1, operand2) {
    // 根据操作生成相应的WAT代码行
    switch (operation) {
      case 'LOAD':
        return `    (get_local $${operand1})`;
      case 'STORE':
        return `    (set_local $${operand1})`;
      case 'PUSH':
        return `    (i32.const ${operand1})`;
      case 'CALL':
        return `    (call $${operand1})`;
      case 'READ':
        return `    (call $read)\n    (set_local $${operand1})`;
      case 'WRITE':
        return `    (call $log)`;
      default:
        return '';
    }
  },

  handleCondition(operation, operand1, operand2) {
    // 根据条件语句操作生成相应的WAT代码行
    switch (operation) {
      case 'IF':
        return '    (if';
      case 'ELSEIF':
        // ELSEIF处理逻辑，需要根据具体情况设计
        return '    (else (if';
      case 'ELSE':
        return '    (else)';
      case 'ENDIF':
        return '    )';
      default:
        return '';
    }
  },

  handleLoop(operation, operand, procedureCode) {
    // 根据循环操作生成相应的WAT代码行，并处理循环标签
    let labelInfo;
    switch (operation) {
      case 'WHILE':
      case 'FOR':
        labelInfo = { start: this.generateLabel(), end: this.generateLabel() };
        this.loopLabelsStack.push(labelInfo);
        procedureCode.push(`    (block $${labelInfo.end}`);
        procedureCode.push(`      (loop $${labelInfo.start}`);
        break;
      case 'ENDWHILE':
      case 'ENDFOR':
        labelInfo = this.loopLabelsStack.pop();
        procedureCode.push(`        br_if $${labelInfo.start}`);
        procedureCode.push(`      )`); // 结束 loop
        procedureCode.push(`    )`); // 结束 block
        break;
    }
  },
};

module.exports = targetCodeGenerator;
