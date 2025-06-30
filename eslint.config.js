import antfu from '@antfu/eslint-config'

export default antfu({
  rules: {
    'style/comma-dangle': 0,
    'vue/html-self-closing': 0,
    'vue/singleline-html-element-content-newline': 0
  }
})
