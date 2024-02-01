// targetCodeGenerator.js

const generateTargetCode = (intermediateCode) => {
    const targetCode = [];
  
    const generateLabel = () => `L${generateLabel.counter++}`;
    generateLabel.counter = 0;
  
    for (const instruction of intermediateCode) {
      switch (instruction.operation) {
        case 'assign':
          targetCode.push(`MOV ${instruction.source}, ${instruction.target}`);
          break;
        case 'add':
          targetCode.push(`ADD ${instruction.source1}, ${instruction.source2}, ${instruction.target}`);
          break;
        case 'subtract':
          targetCode.push(`SUB ${instruction.source1}, ${instruction.source2}, ${instruction.target}`);
          break;
        case 'multiply':
          targetCode.push(`MUL ${instruction.source1}, ${instruction.source2}, ${instruction.target}`);
          break;
        case 'divide':
          targetCode.push(`DIV ${instruction.source1}, ${instruction.source2}, ${instruction.target}`);
          break;
        case 'goto':
          targetCode.push(`JMP ${instruction.target}`);
          break;
        case 'if-greater':
          targetCode.push(`CMP ${instruction.source1}, ${instruction.source2}`);
          targetCode.push(`JG ${instruction.target}`);
          break;
        case 'label':
          targetCode.push(`${instruction.target}:`);
          break;
        // Add cases for other operations as needed
        default:
          throw new Error(`Unsupported operation: ${instruction.operation}`);
      }
    }
  
    return targetCode.join('\n');
  };
  
  module.exports = generateTargetCode;
  