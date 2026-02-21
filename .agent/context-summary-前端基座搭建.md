## 项目上下文摘要（前端基座搭建）
生成时间：2026-02-21 14:15:00

### 1. 相似实现分析
- **实现1**: React生态中的 `three-globe` 与 `react-three-fiber` 结合
  - 模式：使用 R3F 声明式语法构建 3D 场景，利用 `three-globe` 处理 GeoJSON 映射。
  - 可复用：`<mesh>` 材质的自定义 Shader，用于羊皮纸纹理与水彩渐变。
  - 需注意：性能消耗大，需要对 GeoJSON 数据进行精简（如使用 `topojson` 或简化经纬度精度）。
- **实现2**: IndexedDB 封装方案 `idb` 库
  - 模式：基于 Promise 的 IndexedDB 封装，避免原生 API 的事件回调地域。
  - 可复用：`idb` 库提供的 `openDB`, `get`, `put`, `getAll`。
  - 需注意：图片以 Blob 或 Base64 存储，需防范超出浏览器分配限额。
- **实现3**: `zustand` 结合 R3F 的状态管理
  - 模式：使用 Zustand 进行轻量级状态共享，不阻塞 R3F 的渲染循环。
  - 可复用：全局状态 Store（存储当前选中热点、总书影音数据量）。
  - 需注意：保持 3D 侧的状态与 React DOM 侧的状态适度隔离。

### 2. 项目约定
- **命名约定**: React 组件使用 PascalCase 命名 (如 `EarthGlobe.tsx`)，工具函数及 Hooks 使用 camelCase 命名 (如 `useEarthStore.ts`)。
- **文件组织**: 按功能域划分 `src/components`, `src/services`, `src/store`。
- **严格规定**: 一切文档与代码注释强制使用简体中文。采用纯前端无后端设计。

### 3. 可复用组件清单
- 后续将引入封装好的 `ThreeGlobe` 组件以避免重复的地标几何计算。
- 将复用 `idb` 的底层存储方法。

### 4. 测试策略
- **测试框架**: Typescript 强类型编译 + 浏览器开发工具 手动/脚本验证 IndexedDB 储存结果。
- **覆盖要求**: 必须覆盖核心的数据读写流与错误降级处理（当上传过大图片时）。

### 5. 依赖和集成点
- **外部依赖**: `three`, `@react-three/fiber`, `three-globe`, `zustand`, `idb`。
- **内部通信**: Zustand 中保存全局状态给 React DOM UI 层与 Three.js 渲染层共享。

### 6. 关键风险点
- **性能瓶颈**: 3D渲染易产生内测泄漏，频繁的 R3F 状态更新需要避免引起上层 React 不必要的重新渲染；GeoJSON 顶点数量必须严格控制。
- **存储限制**: 将 Blob 存入 IndexedDB 虽然可达到 G 级别，但仍需提供异常监控与“超出配额”时的友善提示。
