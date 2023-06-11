const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        productName: 'Clerk',
        appId: 'com.clerk.app',
        extraResources: [{
          from: 'resources',
          to: './'
        }, {
          from: 'WinTools/WinTools/bin/Release/net7.0',
          to: './WinTools'
        }
        ],
        win: {
          icon: './resources/logo.png',
          artifactName: 'ClerkSetup.exe'
        }
      }
    }
  }
})
