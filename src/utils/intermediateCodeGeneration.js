// src/utils/intermediateCodeGenerator.js

const intermediateCodeGenerator = {
    generateIntermediateCode: function (ast) {
      const intermediateCode = [];
      this.generateCodeFromNode(ast, intermediateCode);
      console.log('Intermediate Code:', intermediateCode);
      return intermediateCode;
    },
  
    generateCodeFromNode: function (node, intermediateCode) {
      if (!node) {
        return;
      }
  
      switch (node.type) {
        case 'program':
          this.generateCodeFromNode(node.block, intermediateCode);
          break;
  
        case 'block':
          this.generateCodeFromNode(node.declaration, intermediateCode);
          this.generateCodeFromNode(node.statement, intermediateCode);
          break;
  
        case 'declaration':
          for (const variable of node.variables) {
            intermediateCode.push(`DECLARE ${variable}`);
          }
          break;
  
        case 'assignment':
          this.generateCodeFromNode(node.expression, intermediateCode);
          intermediateCode.push(`STORE ${node.variable}`);
          break;
  
        case 'expression':
          this.generateCodeFromNode(node.term, intermediateCode);
          break;
  
        case 'term':
          this.generateCodeFromNode(node.factor, intermediateCode);
          break;
  
        case 'factor':
          if (node.type === 'Identifier') {
            intermediateCode.push(`LOAD ${node.value}`);
          } else {
            // Assuming node.type is 'Number'
            intermediateCode.push(`PUSH ${node.value}`);
          }
          break;
  
        // Add cases for other node types as needed
  
        default:
          throw new Error(`Unexpected node type: ${node.type}`);
      }
    },
  };
  
  module.exports = intermediateCodeGenerator;
  