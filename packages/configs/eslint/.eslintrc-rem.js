module.exports = {
  rules: {
    'css-unit-rem': ['error', {
      include: '**/*.{css,scss,less}',
      message: '请使用rem单位进行响应式设计'
    }]
  }
}