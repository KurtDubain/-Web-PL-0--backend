const targetCodeGeneratorExtended = {
  generateWAT: function(intermediateCode) {
    let watCode = [
      '(module',
      '  (import "js" "log" (func $log (param i32)))', // 假设有一个用于输出的外部JavaScript函数
      '  (import "js" "read" (func $read (result i32)))', // 假设有一个用于读取输入的外部JavaScript函数
      '  ;; Variable declarations',
      '  (func $main (export "main")', // 主函数声明
    ];

    let localDeclarations = new Set();
    let labelCounter = 0;
    const generateLabel = () => `label${labelCounter++}`;

    intermediateCode.forEach(instruction => {
      let parts = instruction.split(' ');
      let operation = parts[0];
      let operands = parts.slice(1);

      switch (operation) {
        case 'DECLARE':
          if (!localDeclarations.has(operands[0])) {
            watCode.push(`    (local $${operands[0]} i32)`);
            localDeclarations.add(operands[0]);
          }
          break;
        case 'CONST':
          watCode.push(`    (i32.const ${operands[2]})`);
          watCode.push(`    (set_local $${operands[0]})`);
          break;
        case 'LOAD':
          watCode.push(`    (get_local $${operands[0]})`);
          break;
        case 'STORE':
          watCode.push(`    (set_local $${operands[0]})`);
          break;
        case 'PUSH':
          watCode.push(`    (i32.const ${operands[0]})`);
          break;
        case 'OPER':
          let oper = operands[0];
          switch (oper) {
            case '<=': watCode.push('    (i32.le_s)'); break;
            case '+': watCode.push('    (i32.add)'); break;
            // 添加其他操作符处理
          }
          break;
        case 'IF':
          let labelIf = generateLabel();
          watCode.push(`    (block $${labelIf})`);
          watCode.push(`    (if`);
          break;
        case 'ELSE':
          watCode.push('    (else)');
          break;
        case 'ENDIF':
          watCode.push('    )'); // 结束if
          watCode.push(`    (end $${labelIf})`); // 结束block
          break;
        case 'CALL':
          watCode.push(`    (call $${operands[0]})`);
          break;
        case 'READ':
          watCode.push(`    (call $read)`);
          break;
        case 'WRITE':
          watCode.push(`    (call $log)`);
          break;
        // 处理其他指令，如循环等
      }
    });

    // 结束主函数
    watCode.push('  )');
    // 结束模块
    watCode.push(')');

    return watCode.join('\n');
  }
};
module.exports = targetCodeGeneratorExtended