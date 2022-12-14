const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  css:{
    loaderOptions: {
      sass: {
        prependData: `
          @import "@/scss/_variables.scss";
        `
      }
    }
  },
  

  configureWebpack: (config) => {
    config.module.rules.push({
      test: /\.mjs$/,
      type: 'javascript/auto',
    })
  },
  
  pluginOptions: {
    i18n: {
      locale: 'hu',
      fallbackLocale: 'hu',
      localeDir: 'locales',
      enableLegacy: false,
      runtimeOnly: false,
      compositionOnly: false,
      fullInstall: true
    }
  }
})
