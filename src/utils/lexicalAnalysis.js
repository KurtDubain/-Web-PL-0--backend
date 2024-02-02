// 词法分析器对象
const lexAnalyzer = {
  // 分析函数，接受源代码作为输入，返回token数组
  analyze: function (code) {
    const tokens = [];
    let currentToken = '';
    let currentTokenType = null;

    const isKeyword = (str) => {
      const keywords = ['const', 'var', 'procedure', 'call', 'begin', 'end', 'if', 'then', 'else', 'while', 'do', 'read', 'write'];
      return keywords.includes(str);
    };

    // const isOperator = (char) => ['+', '-', '*', '/', '<>', '<', '<=', '>', '>=', '='].includes(char);

    const isOperator = (char, nextChar) => {
      const operators = [':=', '<>', '<=', '>=', '=', '+', '-', '*', '/', '<', '>'];
      const combinedOperators = operators.filter(op => op.startsWith(char));
    
      if (combinedOperators.length === 1) {
        const combinedOperator = combinedOperators[0];
        if (combinedOperator.length === 1 || (combinedOperator.length === 2 && nextChar === '=')) {
          return true;
        }
      }
    
      return false;
    };
    const pushToken = () => {
      if (currentToken !== '') {
        if (isKeyword(currentToken)) {
          currentTokenType = 'Keyword';
        } else if (!isNaN(currentToken)) {
          currentTokenType = 'Number';
        } else if (isOperator(currentToken)) {
          currentTokenType = 'Operator';
        } else if (currentToken === ':') {
          currentTokenType = 'Colon';
        } else if (currentToken == ':=') {
          currentTokenType = 'Equals';
        } else if (currentToken === ';') {
          currentTokenType = 'Semicolon';
        } else if(currentToken == ','){
          currentTokenType = 'Comma'
        } else {
          currentTokenType = 'Identifier';
        }

        tokens.push({
          type: currentTokenType,
          value: currentToken,
        });
        currentToken = '';
        currentTokenType = null;
      }
    };

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const nextChar = code[i + 1];
    
      if (/\s/.test(char)) {
        pushToken();
      } else if (/[a-zA-Z]/.test(char)) {
        currentToken += char;
      } else if (/\d/.test(char)) {
        // pushToken();
        currentToken = char;
      } else if (isOperator(char, nextChar)) {
        pushToken();
        currentToken = char;
        if (nextChar === '=') {
          currentToken += nextChar;
          i++; // Skip the next character, as it's already part of the operator
        }
      } else {
        pushToken();
        currentToken = char;
      }
    }

    pushToken(); // 处理最后一个标记

    return tokens;
  },
};

module.exports = lexAnalyzer;
