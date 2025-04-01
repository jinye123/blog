# electron

## 什么是 Electron?

Electron 是一个使用 Web 技术（HTML、CSS 和 JavaScript）构建桌面应用程序的框架。它结合了 Node.js 和 Chromium 的能力，允许开发者使用熟悉的 Web 技术来开发跨平台的桌面应用。

## 使用 Electron 的主要优缺点是什么？

- 优点：使用熟悉的 Web 技术开发桌面应用，跨平台支持（Windows、macOS、Linux），丰富的生态系统和社区支持。
- 缺点：应用体积较大，内存使用率较高，性能优化挑战较大。

## Electron 如何实现跨平台应用开发？

Electron 应用通过使用相同的代码基础，结合 Node.js 的能力，可以打包为不同操作系统的原生应用程序。

## 主进程和渲染进程在 Electron 中有什么区别?

- 主进程：负责管理应用的生命周期，如创建窗口、处理应用启动和退出等，负责应用整体的管理和操作系统的交互。
- 渲染进程：负责管理页面内容和用户界面。运行在沙箱环境，限制了对底层操作系统的直接访问，安全隔离。

## electron的生命周期有哪些
主进程
1. ready 代表环境准备好可以window了
2. window-all-close 当所有窗口都被关闭的时候触发
3. before-quit 当应用即将被退出前
4. will-quit 当应用即将被退出前
5. quit 应用退出

渲染进程

1. dom-ready dom已经完全加载和解析完毕 
2. did-finish-load 页面的所有资源加载完毕
3. crash 渲染然进程崩溃 触发这个事件
4. unresponsive 渲染进程无响应

## 如何在 Electron 中实现主进程和渲染进程之间的通信？

- 可以使用 Electron 的IPC机制在主进程和渲染进程之间进行通信。
  - ipcMain 用于主进程中处理进程间通信
  - ipcRenderer 用于渲染进程中发送消息到主进程。
- 渲染进程到渲染进程通信
  - 可以在主进程分配两个port到两个渲染进程实现通信
  - 可以通过在主进程进行中转实现
- 渲染进程到主进程（单向通信）在渲染进程中，使用 ipcRenderer.send 向主进程发送消息,在主进程中，使用 ipcMain.on 监听来自渲染进程的消息。
```js
// 渲染进程 (renderer.js)
const { ipcRenderer } = require('electron');
ipcRenderer.send('message-from-renderer', 'Hello from renderer process!');

// 主进程 (main.js)
const { app, BrowserWindow, ipcMain } = require('electron');
ipcMain.on('message-from-renderer', (event, message) => {
  console.log('主进程收到消息:', message);
});
```
- 主进程到渲染进程（单向通信）使用 webContents.send,在主进程中，使用 webContents.send 向渲染进程发送消息,在渲染进程中，使用 ipcRenderer.on 监听来自主进程的消息。
```js
// 主进程 (main.js)
const { app, BrowserWindow } = require('electron');
const mainWindow = new BrowserWindow();
mainWindow.webContents.send('message-from-main', 'Hello from main process!');

// 渲染进程 (renderer.js)
const { ipcRenderer } = require('electron');
ipcRenderer.on('message-from-main', (event, message) => {
  console.log('渲染进程收到消息:', message);
});
```
- ipcRenderer.invoke 和 ipcMain.handle 用于双向通信。
```js
// 渲染进程 (renderer.js)
const { ipcRenderer } = require('electron');
async function callMainProcess() {
  const result = await ipcRenderer.invoke('dialog:openFile');
  console.log('渲染进程收到结果:', result);
}

// 主进程 (main.js)
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
async function handleFileOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog();
  if (!canceled) {
    return filePaths[0];
  }
}
ipcMain.handle('dialog:openFile', handleFileOpen);
```
- 在主进程中，使用 event.reply 向渲染进程发送异步响应
```js
// 渲染进程 (renderer.js)
const { ipcRenderer } = require('electron');
ipcRenderer.send('asynchronous-message', 'ping');

ipcRenderer.on('asynchronous-reply', (event, arg) => {
  console.log('渲染进程收到异步响应:', arg);
});

// 主进程 (main.js)
const { app, BrowserWindow, ipcMain } = require('electron');
ipcMain.on('asynchronous-message', (event, arg) => {
  console.log('主进程收到异步消息:', arg);
  event.reply('asynchronous-reply', 'pong');
});
```
- 通过 contextBridge 将特定的 IPC 功能暴露给渲染进程，确保安全性和隔离性。
```js
// 预加载脚本 (preload.js)
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  sendMessage: (message) => ipcRenderer.send('message-from-renderer', message),
  onReply: (callback) => ipcRenderer.on('reply-from-main', callback),
});

// 渲染进程 (renderer.js)
window.api.sendMessage('Hello from renderer process!');
window.api.onReply((event, message) => {
  console.log('渲染进程收到回复:', message);
});
```

## electron中如何使用nodejs的功能

- 在browseWindow设置node注入 不推荐
```js
// 主进程 (main.js)
const { app, BrowserWindow } = require('electron');

app.on('ready', () => {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true, // 启用 nodeIntegration
    },
  });

  mainWindow.loadFile('index.html');
});
```
- 使用contentBridge 可以安全地将 Node.js 功能暴露给渲染进程
```js
// 主进程 (main.js)
const { app, BrowserWindow } = require('electron');

app.on('ready', () => {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: __dirname + '/preload.js', // 加载预加载脚本
      sandbox: true, // 启用沙箱模式
    },
  });

  mainWindow.loadFile('index.html');
});
// 预加载脚本 (preload.js)
const { contextBridge, require } = require('electron');
const fs = require('fs'); // 加载 Node.js 的模块

// 使用 contextBridge 安全地暴露函数给渲染进程
contextBridge.exposeInMainWorld('fsApi', {
  readFileSync: (path) => {
    try {
      return fs.readFileSync(path, 'utf8');
    } catch (error) {
      console.error('读取文件失败:', error);
      return null;
    }
  },
  writeFileSync: (path, data) => {
    try {
      return fs.writeFileSync(path, data);
    } catch (error) {
      console.error('写入文件失败:', error);
      return false;
    }
  },
});
```
- 通过主进程代理
```js
// 主进程 (main.js)
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');

app.on('ready', () => {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false, // 禁用 nodeIntegration
    },
  });

  ipcMain.on('read-file', (event, path) => {
    try {
      const data = fs.readFileSync(path, 'utf8');
      event.reply('read-file-reply', data); // 回复文件内容
    } catch (error) {
      event.reply('read-file-reply', null); // 回复失败
    }
  });

  mainWindow.loadFile('index.html');
});
```

## contextBridge 模块在 Electron 中的作用是什么

contextBridge 模块用于安全地将 Node.js 功能暴露给渲染进程，允许访问 Node.js API 同时保持安全性。

## 如何确保 Electron 应用的安全性？

安全措施包括使用 securityContext 选项，避免使用不安全的协议，使用 ses（会话）模块隔离会话。

## 常见的 Electron 性能优化技巧

动态资源按需加载：采用异步加载、懒加载等策略，确保非首屏关键资源在需要时才加载，减少初始加载时间和内存占用


1. 启动优化和初始化优化
   - 预加载：使用预加载技术提前加载某些资源，降低用户交互时的延迟感。Electron 通过 preload 属性实现预加载
   - 懒加载 
   - 减小启动包体积：精简 Electron 应用的主进程和渲染进程代码，剔除不必要的依赖。利用 Webpack 或 Parcel 等工具进行 tree shaking 和 code splitting
   - 使用快速启动模式：Electron 9.0 及以上版本支持快速启动模式，可以更快地启动应用，但可能会影响某些功能的使用
2. 减少进程间通信
   - IPC 通信效率：Electron 中主进程与 Renderer 进程间的通信（IPC）可能成为性能瓶颈。应尽量减少不必要的通信，合理设计消息结构，并可考虑批量处理消息
3. 代码级优化 参考前端性能
   - 性能分析工具：利用 Chromium 内置的 Performance 面板进行性能分析，找出瓶颈并针对性优化
4. 内存管理
   - 管理渲染进程内存：避免在渲染进程中存储大量数据，特别是 DOM 元素和大数组。谨慎使用 remote 模块以减少内存压力。
   - 主进程内存优化：及时释放不再使用的资源，如关闭无用的窗口、清理全局变量等。使用 process.memoryUsage() 监控内存使用情况
   - GPU 内存优化：对于图形密集型应用，合理设置 Chromium 的 GPU 内存限制，防止内存泄漏

## 遇到的问题

- 安装问题 切换网络翻墙
- windows 鼠标拖放和事件是冲突的  使用js来控制
- 避免阻塞主进程 使用web-work来处理计算
- 二进制程序不能打包进 asar 中 只能copy过去 开发和生产环境，获取二进制程序路径方法是不一样的
- 在 Windows 系统上，文件路径可能会出现问题，特别是长路径名的问题。asar 打包可以缓解这一问题

崩溃问题
- 通过 preload 统一初始化崩溃监控使用crash监听
- 渲染进程崩溃后，提示用户重新加载
- 对崩溃日志进行收集分析

优化
- 将 web 端构建所需的依赖全部放到 devDependencies 中，只将在 electron 端需要的依赖放到 dependencies
- 将和生产无关的代码和文件从构建中剔除
- 对跨平台使用的二进制文件，如 ffmpeg 进行按需构建（上文按需构建已介绍）
- 对 node_modules 进行清理精简

- 优先加载核心功能，非核心功能动态加载
- 使用多进程，多线程技术
- 采用 asar 打包：会加快启动速度
增加视觉过渡：loading + 骨架屏


## Electron Forge

### 1. 什么是 Electron Forge？
- **答案**：Electron Forge 是一个用于打包和分发 Electron 应用程序的工具，它提供了多种功能，如自动更新、安装、卸载等。Electron Forge 支持多种平台，包括 Windows、macOS 和 Linux，可以帮助开发者轻松地将 Electron 应用程序打包为原生安装程序。

### 2. 为什么要使用 Electron Forge？
- **答案**：使用 Electron Forge 可以简化 Electron 应用程序的打包和分发过程。它提供了以下优势：
    - **跨平台支持**：支持 Windows、macOS 和 Linux 平台。
    - **自动更新**：可以配置自动更新功能，使用户能够自动获取最新版本的应用程序。
    - **安装和卸载**：提供安装和卸载功能，使用户能够方便地安装和卸载应用程序。
    - **配置灵活**：可以通过配置文件自定义打包和分发的选项。

### 3. 如何使用 Electron Forge 打包应用程序？
- **答案**：使用 Electron Forge 打包应用程序的步骤如下：
    1. **安装 Electron Forge**：
       ```bash
       npm install electron-forge --save-dev
       ```
    2. **初始化配置**：
       ```bash
       npx electron-forge init
       ```
       这将生成一个 `forge.config.js` 文件，用于配置打包选项。
    3. **配置文件**：
       在 `forge.config.js` 文件中，可以配置打包选项，如平台、架构、安装程序类型等。
    4. **打包应用程序**：
       ```bash
       npx electron-forge make
       ```
       这将生成打包后的应用程序安装包。

### 4. 如何配置 Electron Forge 的自动更新功能？
- **答案**：配置 Electron Forge 的自动更新功能需要以下步骤：
    1. **安装 `electron-updater`**：
       ```bash
       npm install electron-updater --save
       ```
    2. **配置 `forge.config.js`**：
       在 `forge.config.js` 文件中，配置 `publishers` 选项，指定更新服务器的 URL。
    3. **实现自动更新逻辑**：
       在主进程中，使用 `electron-updater` 模块实现自动更新逻辑。
       ```javascript
       const { autoUpdater } = require('electron-updater');
       autoUpdater.checkForUpdatesAndNotify();
       ```
    4. **处理更新事件**：
       监听 `update-available` 和 `update-downloaded` 事件，提示用户更新。

### 5. Electron Forge 支持哪些平台？
- **答案**：Electron Forge 支持以下平台：
    - **Windows**：支持生成 `.exe` 安装程序。
    - **macOS**：支持生成 `.dmg` 安装程序。
    - **Linux**：支持生成 `.deb` 和 `.rpm` 安装程序。

### 6. 如何在 Electron Forge 中配置多平台打包？
- **答案**：在 `forge.config.js` 文件中，配置 `platforms` 选项，指定需要打包的平台。例如：
  ```javascript
  module.exports = {
    platforms: ['win32', 'darwin', 'linux'],
  };
  ```
  这将生成 Windows、macOS 和 Linux 平台的安装包。

### 7. Electron Forge 的配置文件有哪些常用选项？
- **答案**：Electron Forge 的配置文件 `forge.config.js` 中，常用的选项包括：
    - **platforms**：指定需要打包的平台。
    - **architectures**：指定需要打包的架构，如 `x64`、`ia32` 等。
    - **publishers**：指定更新服务器的 URL，用于自动更新。
    - **packagerConfig**：配置打包选项，如安装程序的名称、版本等。
    - **makers**：配置安装程序的生成选项，如安装程序的类型、图标等。

### 8. 如何在 Electron Forge 中实现多语言支持？
- **答案**：在 Electron Forge 中实现多语言支持，可以通过以下步骤：
    1. **使用 `i18n` 库**：在项目中使用 `i18n` 库，如 `i18next`，来管理多语言资源。
    2. **配置多语言文件**：在项目中创建多语言文件，如 `locales/en.json` 和 `locales/zh.json`。
    3. **在代码中使用多语言**：在代码中使用 `i18n` 库来加载和使用多语言资源。
    4. **打包多语言资源**：确保多语言资源文件被正确打包到安装包中。

### 9. Electron Forge 如何处理依赖项？
- **答案**：Electron Forge 会自动处理项目中的依赖项，确保所有依赖项都被正确打包到安装包中。可以通过以下步骤确保依赖项被正确处理：
    1. **使用 `npm install`**：确保所有依赖项都已安装。
    2. **配置 `package.json`**：在 `package.json` 文件中，确保所有依赖项都被正确列出。
    3. **使用 `electron-forge` 命令**：在打包时，Electron Forge 会自动处理依赖项。

### 10. 如何在 Electron Forge 中实现自定义安装程序？
- **答案**：在 Electron Forge 中实现自定义安装程序，可以通过以下步骤：
    1. **使用 `makers` 配置**：在 `forge.config.js` 文件中，配置 `makers` 选项，指定安装程序的生成选项。
    2. **自定义安装程序逻辑**：在主进程中，实现自定义安装程序逻辑，如安装前的检查、安装过程中的进度条等。
    3. **使用 `electron-installer`**：可以使用 `electron-installer` 库来生成自定义安装程序。
