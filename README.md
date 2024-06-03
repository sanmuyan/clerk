# Clerk 剪切板工具

## 介绍

一个 Electron + Vue + Element Plus 开发的剪切板记录工具

- 支持自动记录文本、图片、文件
- 支持代码高亮
- 支持分类搜索、收藏、备注、一键复制粘贴

![img](./public/1.png)

## 注意事项

### 兼容性

目前只在 Windows11 平台测试过，理论上任何 Electron 支持的平台都可以使用，可能需要适配

### 配置

安装成功后配置文件在 `USER_HOME./clerk/config.json` 也可以在启动的时候 `--config=xxx` 指定配置文件路径  
数据文件在 `USER_HOME./clerk.db`

### WinTools

#### 功能

以下功能需要 `WinTools`

- 复制后自动激活顶层窗口并粘贴
- 对文件类型的剪切板支持

`WinTools` 基于 `.NET Desktop`
框架需要安装 `.NET Desktop Runtime` [下载地址](https://dotnet.microsoft.com/zh-cn/download/dotnet/thank-you/runtime-desktop-8.0.2-windows-x64-installer)

####

```bash
cd WinTools
dotnet build --configuration Release
```

## 开发

### 调试

```bash
yarn run electron:serve
```

### 打包

```bash
yarn run electron:build
```
