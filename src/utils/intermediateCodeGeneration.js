const intermediateCodeGenerator = {
  generateIntermediateCode(ast) {
    const intermediateCode = [];
    this.generateCodeFromNode(ast, intermediateCode);
    console.log(intermediateCode);
    return intermediateCode.map((item) => item.code); // 只返回代码部分
  },
  generateIntermediateCodeWithLine(ast) {
    const intermediateCodeWithLine = [];
    this.generateCodeFromNode(ast, intermediateCodeWithLine);
    return intermediateCodeWithLine; // 返回包含代码和行号的对象数组
  },

  generateCodeFromNode(node, intermediateCode) {
    if (!node) return;

    switch (node.type) {
      case "Program":
      case "Block":
        node.children?.forEach((child) =>
          this.generateCodeFromNode(child, intermediateCode)
        );
        break;

      case "BeginEndBlock":
        node.statements.forEach((statement) =>
          this.generateCodeFromNode(statement, intermediateCode)
        );
        break;

      case "Declaration":
        node.children.forEach((decl) => {
          const code =
            decl.type === "VarDeclaration"
              ? `DECLARE ${decl.name}`
              : `CONST ${decl.name} = ${decl.value}`;
          intermediateCode.push({ code, line: decl.line });
        });
        break;
      case "ProcedureDeclaration":
        intermediateCode.push({
          code: `PROCEDURE ${node.name} START`,
          line: node.line,
        });
        this.generateCodeFromNode(node.body, intermediateCode);
        intermediateCode.push({
          code: `PROCEDURE ${node.name} END`,
          line: node.line,
        });
        break;

      case "AssignmentStatement":
        this.generateCodeFromNode(node.expression, intermediateCode); // 先处理表达式
        intermediateCode.push({
          code: `STORE ${node.identifier}`,
          line: node.line,
        });
        break;
      case "ProcedureCall":
        intermediateCode.push({ code: `CALL ${node.name}`, line: node.line });
        break;

      case "ReadStatement":
        intermediateCode.push({
          code: `READ ${node.variableName}`,
          line: node.line,
        });
        break;

      case "WriteStatement":
        this.generateCodeFromNode(node.expression, intermediateCode); // 先处理表达式
        intermediateCode.push({ code: `WRITE`, line: node.line });
        break;

      case "IfStatement":
        this.generateCodeFromNode(node.condition, intermediateCode);
        intermediateCode.push({ code: "IF", line: node.line });
        this.generateCodeFromNode(node.thenStatement, intermediateCode);
        if (node.elseIfStatement) {
          node.elseIfStatement.forEach((elseif) => {
            this.generateCodeFromNode(elseif.condition, intermediateCode);
            intermediateCode.push({ code: "ELSEIF", line: elseif.line });
            this.generateCodeFromNode(elseif.thenStatement, intermediateCode);
          });
        }
        if (node.elseStatement) {
          intermediateCode.push({
            code: "ELSE",
            line: node.elseStatement.line,
          });
          this.generateCodeFromNode(node.elseStatement, intermediateCode);
        }
        intermediateCode.push({ code: "ENDIF", line: node.line }); // 可能需要调整行号
        break;

      case "WhileStatement":
        intermediateCode.push({ code: "WHILE", line: node.line });
        this.generateCodeFromNode(node.condition, intermediateCode);
        intermediateCode.push({ code: "DO", line: node.line }); // 明确标记循环体开始
        this.generateCodeFromNode(node.doStatement, intermediateCode);
        intermediateCode.push({ code: "ENDWHILE", line: node.line });
        break;

      case "ForStatement":
        this.generateCodeFromNode(node.initialValue, intermediateCode);
        intermediateCode.push({
          code: `FOR ${node.variableName} INIT`,
          line: node.line,
        });
        this.generateCodeFromNode(node.finalValue, intermediateCode);
        intermediateCode.push({
          code: `FOR ${node.variableName} TO`,
          line: node.line,
        });
        this.generateCodeFromNode(node.body, intermediateCode);
        intermediateCode.push({
          code: `ENDFOR ${node.variableName}`,
          line: node.line,
        });
        break;

      case "BinaryExpression":
        this.generateCodeFromNode(node.left, intermediateCode);
        this.generateCodeFromNode(node.right, intermediateCode);
        intermediateCode.push({
          code: `OPER ${node.operator}`,
          line: node.line,
        });
        break;

      case "Literal":
        intermediateCode.push({ code: `PUSH ${node.value}`, line: node.line });
        break;

      case "Identifier":
        intermediateCode.push({ code: `LOAD ${node.name}`, line: node.line });
        break;

      // 注意：实际中需要添加更多AST节点类型的处理逻辑

      default:
        console.warn(`Unhandled node type: ${node.type}`);
    }
  },
};

module.exports = intermediateCodeGenerator;
