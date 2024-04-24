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
      const { code, line } = instruction;
      const [operation, operand1, operand2] = code.split(" ");
      switch (operation) {
        case "DECLARE":
          //   if (!this.variableDeclarations.has(operand1)) {
          jsCode += `  var ${operand1};//${line}\n`;
          this.variableDeclarations.add(operand1);
          //   }
          break;
        case "CONST":
          jsCode += `var ${operand1} = ${operand2};//${line}\n`;
          break;
        case "LOAD":
          this.varStack.push(operand1);
          break;
        case "STORE":
          const valueToStore = this.varStack.pop();
          this.functionsCode += `  ${operand1} = ${valueToStore};//${line}\n`;
          break;
        case "PUSH":
          this.varStack.push(operand1);
          break;
        case "CALL":
          this.functionsCode += `  ${operand1}();//${line}\n`;
          break;
        case "READ":
          // Assuming `read` is a function you've defined to handle input
          this.functionsCode += `  ${operand1} = await read();//${line}\n`;
          //   this.varStack.push("readValue");
          break;
        case "WRITE":
          const valueToWrite = this.varStack.pop();
          this.functionsCode += `  write(${valueToWrite});//${line}\n`;
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
            this.functionsCode += `function ${operand1}() {//${line}\n`;
          } else {
            // this.functionsCode += `}//${line}\n`;
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
            operand2,
            line
          );
          break;
        case "WHILE":
        case "DO":
        case "ENDWHILE":
        case "FOR":
        case "ENDFOR":
          this.functionsCode += this.handleLoop(
            operation,
            operand1,
            operand2,
            line
          );
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

  handleCondition(operation, operand1, operand2, line) {
    switch (operation) {
      case "IF":
        const conditionIf = this.varStack.pop();
        return `if (${conditionIf}) {//${line}\n`;
      case "ELSEIF":
        const conditionElseIf = this.varStack.pop();
        return `} else if (${conditionElseIf}) {//${line}\n`;
      case "ELSE":
        return `} else {//${line}\n`;
      case "ENDIF":
        // return `}//${line}\n`;
        return `}\n`;

      default:
        return "// Unhandled condition\n";
    }
  },

  handleLoop(operation, operand1, operand2, line) {
    switch (operation) {
      case "WHILE":
        return `while (`;
      case "DO":
        const result = this.varStack.pop();
        // DO logic here if your intermediate code requires it
        return `${result}){//${line}\n`;
      case "ENDWHILE":
        return `}\n`;
      // return `}//${line}\n`;
      case "FOR":
        if (operand2 === "INIT") {
          return `for (${operand1} = 0;${operand1} < `;
        } else if (operand2 === "TO") {
          return `${this.varStack.pop()};${operand1}++){//${line}\n`;
        }
      // Assuming FOR loop structure is defined in your intermediate code
      // return `for (let ${operand1} = 0; ${operand1} < ${operand2}; ${operand1}++) {\n`;
      case "ENDFOR":
        // return `}//${line}\n`;
        return `}\n`;

      default:
        return "// Unhandled loop\n";
    }
  },
};

module.exports = jsTargetCodeGenerator;
