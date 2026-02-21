## 编码前检查 - 前端基座搭建
时间：2026-02-21 14:15:00

□ 已查阅上下文摘要文件：.claude/context-summary-前端基座搭建.md
□ 将使用以下可复用组件：
  - [三方库]: react-three-fiber, three-globe - 用于3D地球渲染与交互
  - [三方库]: zustand - 用于全局状态管理 (当前选中板块, 主题)
  - [三方库]: idb - 用于 IndexedDB 本地数据存储与备份
□ 将遵循命名约定：TypeScript 严格模式，组件使用 PascalCase，Hooks 与 utils 使用 camelCase。
□ 将遵循代码风格：Vite 默认规则，强制全链路使用简体中文进行注释和输出。
□ 确认不重复造轮子，证明：直接使用 `three-globe` 处理复杂的地球 GeoJSON 贴图几何计算，而非使用底层 WebGL 裸写；直接使用成熟的 `idb` 库而不是原始事件驱动的 indexedDB API。

## 分析检查 - UI设计改进 (Archival Brutalism)
时间：2026-02-21 17:35:00

□ 分析了现有模块: `src/components/SidePanel/index.tsx`。
□ 识别了存在的问题：当前使用玻璃拟态(backdrop-blur)和常见的平滑过渡动画(duration-300)，与地球仪的高级复古感不完全匹配，带有明显的“AI模板化”特征。
□ 提出了基于 "Archival Brutalism"（档案馆粗野主义）的改进方案，保留现有地球仪和手写字体，重点改造窗口材质、按钮反馈和切面动效。

## 编码后声明 - UI设计改进 (Archival Brutalism)
时间：2026-02-21 17:38:00

### 1. 复用了以下既有组件
- [TailwindCSS]: 用于定义档案馆风格的直角和硬阴影，直接映射原主题色，位于 `index.tsx`
- [three-globe]: 用于保持当前地球仪三维主视图不变，仅改进外设 UI 交互。

### 2. 遵循了以下项目约定
- 命名约定：遵照已有驼峰参数、手写字体类名等约定。
- 代码风格：严格遵循 Vite React TSX 写法，使用 `border-[Xpx]` 和精准色值实现硬边切割。
- 文件组织：组件继续维持在 `src/components/SidePanel/` 与 `src/components/Earth/` 内，无破坏性拆分。

### 3. 对比了以下相似实现
- [玻璃拟态与平滑过渡实现]: 我的方案废除了这些常见现代 Web 风格，将所有过渡替换为瞬间的高反差黑白颠倒（hover背景被边框色填满），并将下拉投影改为粗野主义的单色实心投影（`-6px 0 0 #5c4033` 等），理由是为了彻底剥离“AI工具感”、“套壳感”，赋予产品真实机械化的人文档案馆质感。

### 4. 未重复造轮子的证明
- 无新增任何外部依赖，完全基于现有 React 状态与 Tailwind 原子类重构视觉层，保证性能最优。
