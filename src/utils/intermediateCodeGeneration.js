// 中间代码生成器
const intermediateCodeGenerator = {
  generateIntermediateCode: function(ast) {
    const intermediateCode = [];
    this.generateCodeFromNode(ast, intermediateCode);
    return intermediateCode;
  },

  generateCodeFromNode: function(node, intermediateCode) {
    if (!node) return;

    switch (node.type) {
      case 'Program':
      case 'Block':
      case 'BeginEndBlock':
        // 检查children是否存在且非空，如果是，遍历children
        if (node.children && node.children.length) {
          node.children.forEach(child => this.generateCodeFromNode(child, intermediateCode));
        }
        break;

      case 'Declaration':
        node.children.forEach(decl => {
          if (decl.type === 'VarDeclaration') {
            intermediateCode.push(`DECLARE ${decl.name}`);
          } else if (decl.type === 'ConstDeclaration') {
            intermediateCode.push(`CONST ${decl.name} = ${decl.value}`);
          }
        });
        break;

      case 'ProcedureDeclaration':
        intermediateCode.push(`PROCEDURE ${node.name} START`);
        this.generateCodeFromNode(node.body, intermediateCode);
        intermediateCode.push(`PROCEDURE ${node.name} END`);
        break;

      case 'AssignmentStatement':
        this.generateCodeFromNode(node.expression, intermediateCode);
        intermediateCode.push(`STORE ${node.identifier}`);
        break;

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

      case 'IfStatement':
        this.generateCodeFromNode(node.condition, intermediateCode);
        intermediateCode.push('IF');
        this.generateCodeFromNode(node.thenStatement, intermediateCode);
        if (node.elseStatement) {
          intermediateCode.push('ELSE');
          this.generateCodeFromNode(node.elseStatement, intermediateCode);
        }
        intermediateCode.push('ENDIF');
        break;

      case 'WhileStatement':
        intermediateCode.push('WHILE');
        this.generateCodeFromNode(node.condition, intermediateCode);
        this.generateCodeFromNode(node.body, intermediateCode);
        intermediateCode.push('ENDWHILE');
        break;

      case 'ForStatement':
        this.generateCodeFromNode(node.initialValue, intermediateCode);
        intermediateCode.push(`FOR ${node.variableName} INIT`);
        this.generateCodeFromNode(node.finalValue, intermediateCode);
        intermediateCode.push(`FOR ${node.variableName} TO`);
        this.generateCodeFromNode(node.body, intermediateCode);
        intermediateCode.push(`ENDFOR ${node.variableName}`);
        break;

      // 添加更多节点类型的处理...

      default:
        console.warn(`Unhandled node type: ${node.type}`);
    }
  }
};

module.exports = intermediateCodeGenerator;
