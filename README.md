# -Web-PL-0--backend
包含了PL/0的开发环境，包括编辑器、调试器、编译器。对应的API接口。服务端项目

### 说明

本项目主要是为了配合前端项目，用于实现pl0的编译处理，转换成wasm给前端用于处理，显示pl0代码运行结果；<br>
本项目是我的毕设项目，如果要使用的话，请联系我本人，邮箱如下：
- [qq邮箱:2574381756@qq.com](2574381756@qq.com)
- [Google邮箱:kurt.du.cobain@gmail.com](kurt.du.cobain@gmail.com)

使用方法：
- 首先声明，需要配合另一个仓库中的前端项目使用
- 克隆代码到本地，执行`npm i`，下载所需要的`npm_modules`
- 确认所需要监听的端口号，无误后开始执行`npm start`，启动服务器

## 还未做完，别急！
### 进度

- 由于这个readme文档更新于2024/2/24，因此接下来我会以现在这个时间为基准讲述项目进度
  - 2/24: 实现了基本的前后端基本通信，能够实现pl0的编译处理（目前实现了词法分析，语法分析，语义分析，中间代码生成），目标代码生成仍存在一些问题，比如循环语句处理和if-else if-else语句的处理等
  - 3/1: 优化了对while语句的中间代码生成处理；优化了for语句的处理；持续完善了if-elseif-else语句的解析；引入wabt，实现了正确的wasm的生成，返回给前端进行执行
  - 3/11: 新增了js目标代码模式，实现了js和wasm的生成；实现了简单的wasm调试功能（存在异常）；引入webSocket，准备优化调试功能（JS模式下）；