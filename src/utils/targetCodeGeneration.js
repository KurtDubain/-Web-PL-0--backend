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

    let procedures = {}; // 存储过程及其局部变量和代码
    let currentProcedure = null;
    let localVars = new Set();

    intermediateCode.forEach(instruction => {
      let [operation, operand1, operand2] = instruction.split(' ');
      switch (operation) {
        case 'DECLARE':
        case 'CONST':
          localVars.add(operand1);
          break;
        case 'PROCEDURE':
          if (operand2 === 'START') {
            currentProcedure = operand1;
            procedures[currentProcedure] = { locals: new Set([...localVars]), code: [] };
            localVars.clear(); // Reset for next procedure
          } else {
            currentProcedure = null; // End of procedure
          }
          break;
        default:
          if (currentProcedure) {
            procedures[currentProcedure].code.push(this.generateInstruction(operation, operand1, operand2));
          }
          break;
      }
    });

    // Generate procedure definitions
    Object.entries(procedures).forEach(([name, { locals, code }]) => {
      watCode.push(`  (func $${name} ${[...locals].map(local => `(local $${local} i32)`).join(' ')}`);
      code.forEach(line => watCode.push(line));
      watCode.push('  )');
      if (name === 'main') {
        watCode.push('  (export "main" (func $main))');
      }
    });

    watCode.push(')'); // End module
    return watCode.join('\n');
  },

  generateInstruction(operation, operand1, operand2) {
    switch (operation) {
      case 'LOAD':
        return `    (get_local $${operand1})`;
      case 'STORE':
        return `    (set_local $${operand1})`;
      case 'PUSH':
        return `    (i32.const ${operand1})`;
      case 'OPER':
        const wasmOp = this.mapOperatorToWasm(operand1);
        return `    ${wasmOp}`;
      case 'CALL':
        return `    (call $${operand1})`;
      case 'READ':
        return `    (call $read)\n    (set_local $${operand1})`;
      case 'WRITE':
        return `    (get_local $${operand1})\n    (call $log)`;
      case 'IF':
      case 'ELSE':
      case 'ENDIF':
        return this.handleCondition(operation, operand1, operand2);
      case 'WHILE':
      case 'FOR':
      case 'ENDWHILE':
      case 'ENDFOR':
        return this.handleLoop(operation, operand1);
      default:
        return '';
    }
  },

  mapOperatorToWasm(operator) {
    const mapping = {
      '+': 'i32.add',
      '-': 'i32.sub',
      '*': 'i32.mul',
      '/': 'i32.div_s',
      // Add more operators as needed
    };
    return mapping[operator] || '';
  },

  handleCondition(operation, operand1, operand2) {
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

  handleLoop(operation, operand) {
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
