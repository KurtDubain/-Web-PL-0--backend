const targetCodeGenerator = {
  labelCounter:0,
  generateWAT: function(intermediateCode) {
    let watCode = [
      '(module',
      '  (import "js" "log" (func $log (param i32)))', // 假设外部日志函数
      '  (import "js" "read" (func $read (result i32)))', // 假设外部读取函数
      '  ;; Variable declarations',
    ];
    

    let localVars = new Set(); // 局部变量集合
    let procedures = {}; // 过程定义
    let currentProcedure = '$main'; // 当前处理的过程，默认为主过程

    procedures[currentProcedure] = []; // 初始化主过程代码数组

    intermediateCode.forEach(line => {
      let [operation, ...operands] = line.split(' ');

      switch (operation) {
        case 'DECLARE':
          if (!localVars.has(operands[0])) {
            watCode.push(`  (local $${operands[0]} i32)`);
            localVars.add(operands[0]);
          }
          break;
        case 'CONST':
          procedures[currentProcedure].push(`    (i32.const ${operands[2]})`);
          procedures[currentProcedure].push(`    (set_local $${operands[0]})`);
          break;
        case 'LOAD':
          procedures[currentProcedure].push(`    (get_local $${operands[0]})`);
          break;
        case 'STORE':
          procedures[currentProcedure].push(`    (set_local $${operands[0]})`);
          break;
        case 'PUSH':
          procedures[currentProcedure].push(`    (i32.const ${operands[0]})`);
          break;
        case 'OPER':
          let wasmOp = this.mapOperatorToWasm(operands[0]);
          procedures[currentProcedure].push(`    ${wasmOp}`);
          break;
          case 'IF':
            // 开始一个 if 构造
            watCode.push(`    (if`);
            break;
          case 'ELSEIF':
            // 处理 elseif，需要先结束上一个 if 或 elseif 块，然后开始一个新的
            watCode.push('    (else');
            watCode.push('      (if');
            break;
          case 'ELSE':
            // 处理 else 块，只需开始一个 else 块
            watCode.push('    (else)');
            break;
          case 'ENDIF':
            // 结束一个 if 块，对于每个 ELSEIF 或 ELSE，我们已经添加了相应的结束标记
            watCode.push('    )'); // 结束 if 或 else
            break;
        case 'CALL':
          procedures[currentProcedure].push(`    (call $${operands[0]})`);
          break;
        case 'READ':
          procedures[currentProcedure].push(`    (call $read)`);
          procedures[currentProcedure].push(`    (set_local $${operands[0]})`);
          break;
        case 'WRITE':
          procedures[currentProcedure].push(`    (call $log)`);
          break;
        case 'PROCEDURE':
          if (operands[1] === 'START') {
            currentProcedure = `$${operands[0]}`;
            procedures[currentProcedure] = [];
          } else {
            watCode.push(`  (func ${currentProcedure} (export "${operands[0]}")`);
            watCode = watCode.concat(procedures[currentProcedure]);
            watCode.push('  )');
            currentProcedure = '$main';
          }
          break;
          case 'WHILE':
  const whileStartLabel = this.generateLabel(); // 确保先声明
  const whileEndLabel = this.generateLabel();
  watCode.push(`    (block $${whileEndLabel}`);
  watCode.push(`      (loop $${whileStartLabel}`);
  // 这里插入循环条件的WAT代码
  // 循环体的WAT代码会在其他部分生成
  break;
case 'ENDWHILE':
  // 这里可能需要插入循环条件的判断逻辑，以决定是否跳转回循环开始
  watCode.push(`        br_if $${whileStartLabel}`);
  watCode.push(`      )`); // 结束loop
  watCode.push(`    )`); // 结束block
  break;
case 'FOR':
  const forStartLabel = this.generateLabel(); // 确保先声明
  const forEndLabel = this.generateLabel();
  // 这里插入FOR循环初始化和条件判断的WAT代码
  watCode.push(`    (block $${forEndLabel}`);
  watCode.push(`      (loop $${forStartLabel}`);
  // 循环体的WAT代码
  break;
case 'ENDFOR':
  // 循环变量更新和条件判断逻辑
  watCode.push(`        br_if $${forStartLabel}`);
  watCode.push(`      )`); // 结束loop
  watCode.push(`    )`); // 结束block
  break;
          
        // 添加其他操作的处理逻辑
      }
    });

    // 添加主过程
    if (currentProcedure === '$main' && procedures[currentProcedure].length > 0) {
      watCode.push('  (func $main (export "main")');
      watCode = watCode.concat(procedures[currentProcedure]);
      watCode.push('  )');
    }

    watCode.push(')'); // 结束模块
    return watCode.join('\n');
  },

  mapOperatorToWasm: function(operator) {
    // 映射操作符到WASM指令
    const opMap = {
      '+': 'i32.add',
      '-': 'i32.sub',
      '*': 'i32.mul',
      '/': 'i32.div_s',
      '<=': 'i32.le_s',
      '>=': 'i32.ge_s',
      '<': 'i32.lt_s',
      '>': 'i32.gt_s',
      '==': 'i32.eq',
      '!=': 'i32.ne',
      // 添加其他操作符的映射
    };
    return opMap[operator] || 'i32.const 0'; // 默认操作
  },
  generateLabel: function() {
    return `label${this.labelCounter++}`; // 使用对象内部的方法来生成标签
  },

};

module.exports = targetCodeGenerator;
