// 词法分析
// 词法分析器对象
const lexAnalyzer = {
  // 分析函数,接受源代码作为输入,返回token数组
    analyze: function (code) {
      const tokens = [];
      let currentToken = '';//当前正在构建的标记字符串
      let currentTokenType = null;//当前正在构建的标记类型
      // 判断是否为关键字
      const isKeyword = (str) => {
        const keywords = ['const', 'var', 'procedure', 'call', 'begin', 'end', 'if', 'then', 'else', 'while', 'do', 'read', 'write'];
        return keywords.includes(str);
      };
      // 判断是否为运算符
      const isOperator = (char) => ['+', '-', '*', '/', '=', '<>', '<', '<=', '>', '>='].includes(char);
      // 将当前构建的标记推入tokens数组中，并清空currentToken
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
      // 遍历源代码的全部字符
      for (let i = 0; i < code.length; i++) {
        const char = code[i];
  
        if (/\s/.test(char)) {
          pushToken();  //空格，则将当前标记推入tokens数组
        } else if (/[a-zA-Z]/.test(char)) {
          currentToken += char; // 字符，添加到当前标记字符串
        } else if (/\d/.test(char)) {
          pushToken(); // 数字的话，将当前标记推入tokens数组
          currentToken = char; // 并将当前字符作为新的标记的开始
        } else if (isOperator(char)) {
          pushToken(); // 运算符，推入并更新
          currentToken = char;
        } else {
          pushToken(); //其他字符，推入并更新
          currentToken = char;
        }
      }
  
      pushToken(); // 处理最后一个标记
  
      return tokens;
    },
  };
  
  module.exports = lexAnalyzer;
  