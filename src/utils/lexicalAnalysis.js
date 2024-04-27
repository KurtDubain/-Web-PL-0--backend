// 词法分析
const lexAnalyzer = {
  analyze: function (code) {
    const tokens = [];
    let currentToken = "";
    let currentLine = 1;
    let isComment = false;
    // 对关键词的定义
    const keywords = [
      "const",
      "var",
      "procedure",
      "call",
      "begin",
      "end",
      "if",
      "then",
      "else",
      "while",
      "do",
      "read",
      "write",
      "for",
      "to",
      "endif",
      "endfor",
      "endwhile",
    ];
    // 将分号、逗号、句号从operators移除，单独处理
    const operators = ["+", "-", "*", "/", "=", "<", "<=", ">", ">="];
    const equals = [":="]; // 特殊符号：分号、逗号、句号
    // 空格
    const isWhitespace = (char) => /\s/.test(char);
    // 字母
    const isLetter = (char) => /[a-zA-Z]/.test(char);
    // 数字
    const isDigit = (char) => /\d/.test(char);
    // 处理token
    const addToken = (type, value, line = currentLine) => {
      tokens.push({ type, value, line });
      currentToken = "";
    };

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const nextChar = code[i + 1];
      if (char === "\n") {
        currentLine++;
        isComment = false;
      }
      if (isComment) {
        continue;
      }
      if (char === "/" && nextChar === "/") {
        isComment = true;
        continue;
      }
      if (isWhitespace(char)) {
        if (currentToken !== "") {
          // 如果当前有正在构建的token，则根据其内容确定类型并添加
          addToken(
            keywords.includes(currentToken) ? "Keyword" : "Identifier",
            currentToken
          );
        }
        continue; // 继续处理下一个字符
      }

      if (isLetter(char)) {
        currentToken += char;
        if (!(isLetter(nextChar) || isDigit(nextChar))) {
          addToken(
            keywords.includes(currentToken) ? "Keyword" : "Identifier",
            currentToken
          );
        }
      } else if (isDigit(char)) {
        currentToken += char;
        if (!isDigit(nextChar)) {
          addToken("Number", currentToken);
        }
      } else if (operators.includes(char)) {
        if (currentToken !== "") {
          addToken("Identifier", currentToken);
        }
        currentToken = char;
        if (char === ">" && nextChar === "=") {
          currentToken += nextChar;
          i++; // 跳过下一个字符（'='），因为它已经作为操作符的一部分被处理
          // addToken('Operator',currentToken)
        }
        if (char === "<" && nextChar === "=") {
          currentToken += nextChar;
          i++;
          // addToken('Operator',currentToken)
        }
        if (char === "<" && nextChar === ">") {
          currentToken += nextChar;
          i++;
        }
        addToken("Operator", currentToken);
      } else if (char === ",") {
        // 对于分号、逗号、句号，直接作为特殊符号处理
        addToken("Comma", char);
      } else if (char === ";") {
        addToken("Semicolon", char);
      } else if (char === ".") {
        addToken("End", char);
      } else if (char === ":" && nextChar === "=") {
        currentToken += nextChar;
        i++;
        addToken("Equals", ":=");
      } else if (char === "(" || char === ")") {
        addToken("Parenthesis", char); // 'Parenthesis'是一个新的Token类型
      } else {
        if (currentToken !== "") {
          addToken("Identifier", currentToken);
        }
        // 其他未识别的单字符可能需要特殊处理或报错
        console.error(`Unrecognized character: ${char}`);
      }
    }

    // 检查并添加最后一个token（如果有）
    if (currentToken !== "") {
      addToken(
        keywords.includes(currentToken) ? "Keyword" : "Identifier",
        currentToken
      );
    }
    // EOF表示终止符
    tokens.push({ type: "EOF", value: null, line: currentLine });

    return tokens;
  },
};

module.exports = lexAnalyzer;
