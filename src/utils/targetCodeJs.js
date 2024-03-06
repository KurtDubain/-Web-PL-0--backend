const jsTargetCodeGenerator = {
  labelCounter: 0,
  loopLabelsStack: [],
  variableDeclarations: new Set(),
  varStack: [],
  functionsCode: "",

  generateLabel() {
    return `label_${this.labelCounter++}`;
  },

  generateJS(intermediateCode) {
    let jsCode = "";
    this.functionsCode = "";

    intermediateCode.forEach((instruction) => {
      const [operation, operand1, operand2] = instruction.split(" ");
      switch (operation) {
        case "DECLARE":
          //   if (!this.variableDeclarations.has(operand1)) {
          jsCode += `  let ${operand1};\n`;
          this.variableDeclarations.add(operand1);
          //   }
          break;
        case "CONST":
          jsCode += `const ${operand1} = ${operand2};\n`;
          break;
        case "LOAD":
          this.varStack.push(operand1);
          break;
        case "STORE":
          const valueToStore = this.varStack.pop();
          this.functionsCode += `  ${operand1} = ${valueToStore};\n`;
          break;
        case "PUSH":
          this.varStack.push(operand1);
          break;
        case "CALL":
          this.functionsCode += `  ${operand1}();\n`;
          break;
        case "READ":
          // Assuming `read` is a function you've defined to handle input
          this.functionsCode += `  ${operand1} = await read();\n`;
          //   this.varStack.push("readValue");
          break;
        case "WRITE":
          const valueToWrite = this.varStack.pop();
          this.functionsCode += `  write(${valueToWrite});\n`;
          break;
        case "OPER":
          const right = this.varStack.pop();
          const left = this.varStack.pop();
          const result = this.handleOperation(operand1, left, right);
          this.varStack.push(result);
          //   console.log(result);
          break;
        case "PROCEDURE":
          if (operand2 === "START") {
            this.functionsCode += `function ${operand1}() {\n`;
          } else {
            this.functionsCode += `}\n`;
          }
          break;
        case "IF":
        case "ELSEIF":
        case "ELSE":
        case "ENDIF":
          this.functionsCode += this.handleCondition(
            operation,
            operand1,
            operand2
          );
          break;
        case "WHILE":
        case "DO":
        case "ENDWHILE":
        case "FOR":
        case "ENDFOR":
          this.functionsCode += this.handleLoop(operation, operand1, operand2);
          break;
        default:
          this.functionsCode += "// Unhandled operation\n";
          break;
      }
    });

    return jsCode + this.functionsCode;
  },

  handleOperation(operation, left, right) {
    const operatorMappings = {
      "+": `${left} + ${right}`,
      "-": `${left} - ${right}`,
      "*": `${left} * ${right}`,
      "/": `${left} / ${right}`,
      ">": `${left} > ${right}`,
      "<": `${left} < ${right}`,
      "=": `${left} == ${right}`,
      // Add more operators as needed
    };
    // console.log(operation);
    // console.log(operatorMappings);
    return operatorMappings[operation];
  },

  handleCondition(operation, operand1, operand2) {
    switch (operation) {
      case "IF":
        const conditionIf = this.varStack.pop();
        return `if (${conditionIf}) {\n`;
      case "ELSEIF":
        const conditionElseIf = this.varStack.pop();
        return `} else if (${conditionElseIf}) {\n`;
      case "ELSE":
        return `} else {\n`;
      case "ENDIF":
        return `}\n`;
      default:
        return "// Unhandled condition\n";
    }
  },

  handleLoop(operation, operand1, operand2) {
    switch (operation) {
      case "WHILE":
        return `while (`;
      case "DO":
        const result = this.varStack.pop();
        // DO logic here if your intermediate code requires it
        return `${result}){\n`;
      case "ENDWHILE":
        return `}\n`;
      case "FOR":
        if (operand2 === "INIT") {
          return `for (${operand1} = 0;${operand1} < `;
        } else if (operand2 === "TO") {
          return `${this.varStack.pop()};${operand1}++){\n`;
        }
      // Assuming FOR loop structure is defined in your intermediate code
      // return `for (let ${operand1} = 0; ${operand1} < ${operand2}; ${operand1}++) {\n`;
      case "ENDFOR":
        return `}\n`;
      default:
        return "// Unhandled loop\n";
    }
  },
};

module.exports = jsTargetCodeGenerator;
