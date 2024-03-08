const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  pluginOptions: {
    electronBuilder: {
      mainProcessWatch: ['src/**/*.js'],
      nodeIntegration: true,
      builderOptions: {
        productName: 'Clerk',
        appId: 'com.sanmuyan.clerk',
        extraResources: [{
          from: 'resources',
          to: './'
        }],
        win: {
          icon: './resources/logo.png',
          artifactName: 'ClerkSetup.exe',
          legalTrademarks: 'sanmuyan',
          extraResources: [
            {
              from: 'WinTools/WinTools/bin/Release/net8.0',
              to: './WinTools'
            }
          ]
        }
      }
    }
  }
})
