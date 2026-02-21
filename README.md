# TEARTH

TEARTH is a 3D interactive globe application focused on visualizing personal digital footprints for movies, books, and music, built with React, TypeScript, and Vite.

TEARTH 是一款基于 React、TypeScript 和 Vite 构建的 3D 互动地球应用，专注于通过 3D 地球仪可视化展现用户在电影、书籍和音乐方面的个人档案与数字足迹。

## Features
- **3D Globe Visualization**: Interactive rendering of the world with drill-down capabilities into specific provinces or states.
- **Data Overlay**: Heatmaps displaying the distribution of user media records across continents and countries.
- **Local Storage**: All data is securely stored and managed offline via IndexedDB, ensuring absolute privacy.
- **Archival Interface**: A brutalist, retro-inspired user interface that feels like navigating a top-secret classified physical archive room.

## 功能特性
- **3D地球可视化**：支持流畅且高性能的交互式地球渲染，并能无缝下钻查看特定国家的省级边界。
- **数据叠加热力图**：通过全球热力分布直观映射各个国家或地区收录的书影音档案数量。
- **本地纯离线存储**：完全基于 IndexedDB 本地沙盒管理所有数据，无任何服务端数据收集，保障隐私与安全。
- **档案馆粗野UI**：呈现出极简、硬朗且带有实体机要室纸质档案质感的界面设计风格。

## Development Setup / 本地开发
1. Install dependencies: / 安装依赖:
```bash
npm install
```
2. Start the development server: / 启动本地开发服务器:
```bash
npm run dev
```

## Data Dependency Note / 数据依赖说明
The application requires GeoJSON geographical boundary files (e.g. `countries.geojson` and simplified province data) to operate the globe mesh and drill-down features. Such data is inherently large and is purposely excluded from the git repository. Users are required to provide their own data locally in the specific format required by the application.

运行本项目的 3D 多边形渲染、以及地球区域下钻等核心功能需依赖相应的 GeoJSON 边界包（如 `countries.geojson` 及各子区域数据）。为保持代码仓库精简，此类大体积静态数据及个人数据文件未被包含于本仓库中。使用者部署开发环境时需自行准备相关地形数据放置于公共资源目录。
