# 🎨 颜色调色板系统 - 完整指南

## 🌟 功能概述

这是一个功能完整的颜色主题系统，提供了64种不同类型的颜色，支持实时调整、预设主题、透明度控制等高级功能。所有设置自动保存并在应用重启后保持。

## 文件结构

```
src/
├── components/
│   └── ColorPalette.tsx          # 调色板组件
├── contexts/
│   └── ColorThemeContext.tsx     # 全局颜色主题Context
├── hooks/
│   └── useColorTheme.ts          # 颜色主题状态管理
├── styles/
│   └── dynamicStyles.ts          # 动态样式生成
└── constants/
    └── index.ts                  # 配置常量（包含开关）
```

## 使用方法

### 1. 开启调色板
- 点击右下角的 🎨 浮动按钮
- 调色板面板会从右下角弹出

### 2. 调整颜色
- **滑动条调节**: 分别调节红、绿、蓝三个通道
- **预设配色**: 点击预设的配色方案快速应用
- **颜色预览**: 实时查看当前选择的颜色

### 3. 切换标签
- **主色调**: 调节按钮、重点文字等的颜色
- **背景色**: 调节页面背景颜色

### 4. 关闭调色板
- 点击调色板右上角的 ✕ 按钮
- 或再次点击右下角的 🎨 按钮

## 开关控制

在 `src/constants/index.ts` 中可以控制调色板功能：

```typescript
export const DEV_CONFIG = {
  // 其他配置...
  ENABLE_COLOR_PALETTE: true, // 设置为 false 完全禁用调色板
} as const;
```

## 预设配色方案

工具内置了8组配色方案：
1. 原始绿色主题 (#66CC99 + #F2F2F2)
2. 红色主题 (#FF6B6B + #FFE5E5)
3. 青色主题 (#4ECDC4 + #E8F8F7)
4. 蓝色主题 (#45B7D1 + #E8F4FD)
5. 薄荷绿主题 (#96CEB4 + #F0F9F4)
6. 黄色主题 (#FFEAA7 + #FFFBF0)
7. 紫色主题 (#DDA0DD + #F8F0F8)
8. 橙色主题 (#FFA07A + #FFF4F0)

## 持久化存储

- 颜色设置自动保存到本地存储
- 页面刷新后会恢复之前的颜色配置
- 调试模式开关状态也会被保存

## 技术实现

### 1. Context 架构
使用 React Context 提供全局颜色主题，避免 prop drilling 问题。

### 2. 状态管理
通过 `useColorTheme` Hook 管理颜色状态和持久化。

### 3. 动态样式
创建 `createDynamicStyles` 函数根据主题生成样式。

### 4. 组件化设计
调色板组件完全独立，可以轻松移植到其他项目。

## 测试

### 独立测试组件
```typescript
import ColorPaletteTest from './ColorPaletteTest';
// 使用这个简化的测试组件来验证功能
```

### Web测试页面
打开 `test-color-palette.html` 在浏览器中预览效果。

## 开发建议

### 添加新颜色
在 `ColorTheme` 接口中添加新的颜色属性：

```typescript
interface ColorTheme {
  PRIMARY: string;
  BACKGROUND: string;
  NEW_COLOR: string; // 添加新颜色
  // ...
}
```

### 扩展预设
在 `ColorPalette.tsx` 的 `presetColors` 数组中添加更多预设。

### 支持更多组件
通过 `useTheme()` Hook 在任何组件中访问动态颜色。

## 故障排除

### 1. 调色板不显示
- 检查 `DEV_CONFIG.ENABLE_COLOR_PALETTE` 是否为 `true`
- 确认 Context Provider 是否正确包裹组件

### 2. 颜色不生效
- 确保组件使用了 `useTheme()` Hook
- 检查样式是否正确应用动态颜色

### 3. 设置不保存
- 检查本地存储权限
- 确认 `CookieManager` 工作正常

## 性能考虑

- 颜色更新使用防抖机制
- 样式计算采用 memoization
- 动画使用 React Native Animated API 优化