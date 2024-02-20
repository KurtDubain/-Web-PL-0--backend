const intermediateCodeGenerator = {
  generateIntermediateCode(ast) {
    const intermediateCode = [];
    this.generateCodeFromNode(ast, intermediateCode);
    return intermediateCode;
  },

  generateCodeFromNode(node, intermediateCode) {
    if (!node) return;

    switch (node.type) {
      case 'Program':
      case 'Block':
        // 对于Block类型，我们需要遍历其所有声明和语句
        node.children?.forEach(child => this.generateCodeFromNode(child, intermediateCode));
        break;

      case 'BeginEndBlock':
        // BeginEndBlock可能直接包含一系列语句
        node.statements.forEach(statement => this.generateCodeFromNode(statement, intermediateCode));
        break;

      case 'Declaration':
        node.children.forEach(decl => {
          // 处理变量和常量声明
          if (decl.type === 'VarDeclaration') {
            intermediateCode.push(`DECLARE ${decl.name}`);
          } else if (decl.type === 'ConstDeclaration') {
            intermediateCode.push(`CONST ${decl.name} = ${decl.value}`);
          }
        });
        break;

      case 'ProcedureDeclaration':
        // 进入和离开过程声明
        intermediateCode.push(`PROCEDURE ${node.name} START`);
        this.generateCodeFromNode(node.body, intermediateCode);
        intermediateCode.push(`PROCEDURE ${node.name} END`);
        break;

      case 'AssignmentStatement':
        // 生成赋值语句的中间代码
        this.generateCodeFromNode(node.expression, intermediateCode);
        intermediateCode.push(`STORE ${node.identifier}`);
        break;

      case 'IfStatement':
        // 生成条件判断的中间代码
        this.generateExpressionCode(node.condition, intermediateCode);
                intermediateCode.push('IF');
                this.generateCodeFromNode(node.thenStatement, intermediateCode);
                if (node.elseIfStatement) {
                    node.elseIfStatement.forEach(elseif => {
                        intermediateCode.push('ELSEIF');
                        this.generateCodeFromNode(elseif.condition, intermediateCode);
                        this.generateCodeFromNode(elseif.thenStatement, intermediateCode);
                    });
                }
                if (node.elseStatement) {
                    intermediateCode.push('ELSE');
                    this.generateCodeFromNode(node.elseStatement, intermediateCode);
                }
                intermediateCode.push('ENDIF');
                break;

      case 'WhileStatement':
        // 生成while循环的中间代码
        this.generateCodeFromNode(node.condition, intermediateCode);
        intermediateCode.push('WHILE');
        this.generateCodeFromNode(node.body, intermediateCode);
        intermediateCode.push('ENDWHILE');
        break;

      case 'ForStatement':
        // 生成for循环的中间代码
        this.generateCodeFromNode(node.initialValue, intermediateCode);
        intermediateCode.push(`FOR ${node.variableName} INIT`);
        this.generateCodeFromNode(node.finalValue, intermediateCode);
        intermediateCode.push(`FOR ${node.variableName} TO`);
        this.generateCodeFromNode(node.body, intermediateCode);
        intermediateCode.push(`ENDFOR ${node.variableName}`);
        break;

      // 处理表达式节点
      case 'BinaryExpression':
        this.generateCodeFromNode(node.left, intermediateCode);
        this.generateCodeFromNode(node.right, intermediateCode);
        intermediateCode.push(`OPER ${node.operator}`);
        break;

      case 'Literal':
        intermediateCode.push(`PUSH ${node.value}`);
        break;

      case 'Identifier':
        intermediateCode.push(`LOAD ${node.name}`);
        break;

      case 'ProcedureCall':
        intermediateCode.push(`CALL ${node.name}`);
        break;

      // 添加对其他节点类型的处理...

      default:
        console.warn(`Unhandled node type: ${node.type}`);
    }
  },
  generateExpressionCode(node, intermediateCode) {
    switch (node.type) {
        case 'BinaryExpression':
            this.generateCodeFromNode(node.left, intermediateCode);
            this.generateCodeFromNode(node.right, intermediateCode);
            intermediateCode.push(`OPER ${node.operator}`);
            break;
        case 'Literal':
            intermediateCode.push(`PUSH ${node.value}`);
            break;
        case 'Identifier':
            intermediateCode.push(`LOAD ${node.name}`);
            break;
        default:
            console.warn(`Unhandled expression type: ${node.type}`);
    }
}
};

module.exports = intermediateCodeGenerator;
