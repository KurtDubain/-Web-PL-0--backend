// 词法分析

const lexAnalyzer = {
    analyze: function (code) {
      const tokens = [];
      let currentToken = '';
      let currentTokenType = null;
  
      const isKeyword = (str) => {
        const keywords = ['const', 'var', 'procedure', 'call', 'begin', 'end', 'if', 'then', 'else', 'while', 'do', 'read', 'write'];
        return keywords.includes(str);
      };
  
      const isOperator = (char) => ['+', '-', '*', '/', '=', '<>', '<', '<=', '>', '>='].includes(char);
  
      const pushToken = () => {
        if (currentToken !== '') {
          if (isKeyword(currentToken)) {
            currentTokenType = 'Keyword';
          } else if (!isNaN(currentToken)) {
            currentTokenType = 'Number';
          } else if (isOperator(currentToken)) {
            currentTokenType = 'Operator';
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
  
        if (/\s/.test(char)) {
          pushToken();
        } else if (/[a-zA-Z]/.test(char)) {
          currentToken += char;
        } else if (/\d/.test(char)) {
          pushToken();
          currentToken = char;
        } else if (isOperator(char)) {
          pushToken();
          currentToken = char;
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
  