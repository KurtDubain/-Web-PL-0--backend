const targetCodeGeneratorExtended = {
  generateWAT: function (intermediateCode) {
      let watCode = [
          '(module',
          '  (import "js" "log" (func $log (param i32)))', // 假设有一个用于输出的外部JavaScript函数
          '  ;; Variable declarations',
          '  (func $main (export "main")', // 主函数声明
      ];

      // 用于跟踪局部变量声明，以避免重复声明
      let localDeclarations = new Set();
      // 用于生成唯一标签，例如循环和条件语句的标签
      let labelCounter = 0;
      const generateLabel = () => `label${labelCounter++}`;

      // 处理每条中间代码指令
      intermediateCode.forEach(instruction => {
          // 将指令字符串分割为操作和操作数
          let parts = instruction.split(' ');
          let operation = parts[0];
          let operands = parts.slice(1);

          switch (operation) {
              case 'CONST':
              case 'DECLARE':
                  // 处理变量声明
                  if (!localDeclarations.has(operands[0])) {
                      watCode.push(`    (local $${operands[0]} i32)`);
                      localDeclarations.add(operands[0]);
                  }
                  if (operation === 'CONST') {
                      watCode.push(`    (set_local $${operands[0]} (i32.const ${operands[2]}))`);
                  }
                  break;
              case 'PROCEDURE':
                  // 这里简化处理，不实现具体的函数声明逻辑
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
                  // 根据操作符生成相应的WAT操作
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