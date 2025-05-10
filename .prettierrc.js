// .prettierrc.js
module.exports = {
  printWidth: 100, // 每行最大字符数
  tabWidth: 2, // tab 宽度
  semi: true, // 句尾添加分号
  singleQuote: true, // 使用单引号
  quoteProps: "as-needed", // 对象属性的引号按需添加
  jsxSingleQuote: false, // JSX 中不使用单引号
  trailingComma: "es5", // 在 ES5 中有效的尾逗号（对象、数组等）
  bracketSpacing: true, // 对象大括号内侧空格
  bracketSameLine: false, // JSX 标签的反尖括号 > 是否和属性在同一行
  arrowParens: "always", // 箭头函数参数始终带括号
  vueIndentScriptAndStyle: false, // Vue 文件中的 <script> 和 <style> 标签不进行缩进
  endOfLine: "lf", // 统一换行符为 LF
};
