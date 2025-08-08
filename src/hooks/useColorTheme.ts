import { useState, useEffect } from 'react';
import { CookieManager } from '../utils/cookieManager';
import { COLORS } from '../constants';

interface ColorTheme {
  // 主要颜色系统
  PRIMARY: string;
  PRIMARY_LIGHT: string;
  PRIMARY_DARK: string; 
  BACKGROUND: string;
  WHITE: string;
  BLACK: string;
  
  // 文本颜色系统
  TEXT_PRIMARY: string;
  TEXT_SECONDARY: string;
  TEXT_MUTED: string;
  TEXT_INVERSE: string;     // 反色文本（通常为白色）
  
  // 状态颜色系统
  SUCCESS: string;          // 成功状态颜色
  SUCCESS_LIGHT: string;    // 浅色成功背景
  ERROR: string;
  ERROR_BACKGROUND: string;
  WARNING: string;          
  WARNING_BACKGROUND: string; 
  WARNING_BORDER: string;   
  WARNING_TEXT: string;     
  INFO: string;            
  INFO_LIGHT: string;       // 浅色信息背景
  
  // 灰色系统（完整的灰色阶梯）
  GRAY_50: string;         
  GRAY_100: string;        
  GRAY_200: string;        
  GRAY_300: string;        
  GRAY_400: string;        
  GRAY_500: string;        
  GRAY_600: string;        
  GRAY_700: string;        
  GRAY_800: string;
  GRAY_900: string;        // 最深灰
  GRAY_1000: string;
  
  // 界面元素颜色
  BORDER: string;
  BORDER_LIGHT: string;     // 浅色边框
  SHADOW: string;
  CARD_BACKGROUND: string; 
  DISABLED_BACKGROUND: string; 
  DISABLED_TEXT: string;   
  PLACEHOLDER_TEXT: string; 
  
  // 特殊效果颜色
  OVERLAY: string;         
  OVERLAY_LIGHT: string;   
  OVERLAY_DARK: string;     // 深色遮罩
  TRANSPARENT: string;     
  
  // 新增：常用的UI颜色
  DIVIDER: string;          // 分割线颜色
  HOVER: string;            // 悬停效果
  FOCUS: string;            // 焦点效果
  SELECTED: string;         // 选中状态
  HIGHLIGHT: string;        // 高亮颜色
}

interface ThemeState {
  colors: ColorTheme;
  opacity: {
    primary: number;
    background: number;
  };
}

// 自动生成颜色变化的辅助函数
const lightenColor = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
};

const darkenColor = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
    (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
    (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
};

const DEFAULT_THEME_STATE: ThemeState = {
  colors: {
    // 主要颜色系统
    PRIMARY: COLORS.PRIMARY,
    PRIMARY_LIGHT: lightenColor(COLORS.PRIMARY, 20),
    PRIMARY_DARK: darkenColor(COLORS.PRIMARY, 20),
    BACKGROUND: COLORS.BACKGROUND,
    WHITE: COLORS.WHITE,
    BLACK: '#000000',
    
    // 文本颜色系统
    TEXT_PRIMARY: COLORS.TEXT_PRIMARY,
    TEXT_SECONDARY: COLORS.TEXT_SECONDARY,
    TEXT_MUTED: COLORS.TEXT_MUTED,
    TEXT_INVERSE: '#FFFFFF',
    
    // 状态颜色系统
    SUCCESS: '#10b981',
    SUCCESS_LIGHT: '#D1FAE5',
    ERROR: COLORS.ERROR,
    ERROR_BACKGROUND: COLORS.ERROR_BACKGROUND,
    WARNING: '#f59e0b',
    WARNING_BACKGROUND: '#FFF3CD',
    WARNING_BORDER: '#FFEAA7',
    WARNING_TEXT: '#8B6914',
    INFO: '#339af0',
    INFO_LIGHT: '#E0F2FE',
    
    // 灰色系统 - 使用新的色卡颜色
    GRAY_50: '#f9fafb',          // 保持浅色
    GRAY_100: '#f3f4f6',         
    GRAY_200: '#FEFCF4',         // 浅黄色
    GRAY_300: '#DDDDDD',         // 浅灰色
    GRAY_400: '#AAAAAA',         // 中灰色  
    GRAY_500: '#555555',         // 深灰色
    GRAY_600: '#4b5563',         
    GRAY_700: '#374151',
    GRAY_800: '#1f2937',
    GRAY_900: '#000000',         // 黑色
    GRAY_1000: '#e1e1e1',
    
    // 界面元素颜色
    BORDER: COLORS.BORDER,
    BORDER_LIGHT: '#FEFCF4',
    SHADOW: COLORS.SHADOW,
    CARD_BACKGROUND: '#FEFCF4',
    DISABLED_BACKGROUND: '#FEFCF4',
    DISABLED_TEXT: '#AAAAAA',
    PLACEHOLDER_TEXT: '#AAAAAA',
    
    // 特殊效果颜色
    OVERLAY: 'rgba(0, 0, 0, 0.5)',
    OVERLAY_LIGHT: 'rgba(255, 255, 255, 0.9)',
    OVERLAY_DARK: 'rgba(0, 0, 0, 0.7)',
    TRANSPARENT: 'transparent',
    
    // 常用的UI颜色
    DIVIDER: '#AAAAAA',
    HOVER: 'rgba(255, 153, 68, 0.1)',
    FOCUS: lightenColor(COLORS.PRIMARY, 30),
    SELECTED: lightenColor(COLORS.PRIMARY, 40),
    HIGHLIGHT: '#FEFCF4',
  },
  opacity: {
    primary: 1.0,
    background: 1.0,
  },
};

// 辅助函数：将十六进制颜色转换为rgba格式
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const STORAGE_KEY = 'colorTheme';

export const useColorTheme = () => {
  const [themeState, setThemeState] = useState<ThemeState>(DEFAULT_THEME_STATE);
  const [isDebugMode, setIsDebugMode] = useState(false);

  // 计算带透明度的主题
  const theme = {
    ...themeState.colors,
    PRIMARY_WITH_OPACITY: hexToRgba(themeState.colors.PRIMARY, themeState.opacity.primary),
    BACKGROUND_WITH_OPACITY: hexToRgba(themeState.colors.BACKGROUND, themeState.opacity.background),
  };

  useEffect(() => {
    loadTheme();
    loadDebugMode();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await CookieManager.getItem(STORAGE_KEY);
      if (savedTheme) {
        const parsedTheme = JSON.parse(savedTheme);
        setThemeState({ ...DEFAULT_THEME_STATE, ...parsedTheme });
      }
    } catch (error) {
      console.log('Failed to load theme:', error);
    }
  };

  const loadDebugMode = async () => {
    try {
      const debugMode = await CookieManager.getItem('colorDebugMode');
      if (debugMode) {
        setIsDebugMode(JSON.parse(debugMode));
      }
    } catch (error) {
      console.log('Failed to load debug mode:', error);
    }
  };

  const saveTheme = async (newThemeState: Partial<ThemeState>) => {
    try {
      const updatedThemeState = {
        ...themeState,
        ...newThemeState,
        colors: {
          ...themeState.colors,
          ...newThemeState.colors,
        },
        opacity: {
          ...themeState.opacity,
          ...newThemeState.opacity,
        },
      };
      setThemeState(updatedThemeState);
      await CookieManager.saveItem(STORAGE_KEY, JSON.stringify(updatedThemeState));
    } catch (error) {
      console.log('Failed to save theme:', error);
    }
  };

  const updatePrimaryColor = (color: string) => {
    saveTheme({ 
      colors: { 
        ...themeState.colors,
        PRIMARY: color,
        PRIMARY_LIGHT: lightenColor(color, 20),
        PRIMARY_DARK: darkenColor(color, 20),
        FOCUS: lightenColor(color, 30),
        SELECTED: lightenColor(color, 40),
      } 
    });
  };

  const updateBackgroundColor = (color: string) => {
    saveTheme({ 
      colors: { 
        ...themeState.colors,
        BACKGROUND: color, 
        BORDER: color 
      } 
    });
  };

  // 新增：更新所有颜色的方法
  const updateAllColors = (colors: Partial<ColorTheme>) => {
    saveTheme({ 
      colors: { 
        ...themeState.colors,
        ...colors
      } 
    });
  };

  const updateTextColors = (primaryText: string, secondaryText?: string, mutedText?: string) => {
    saveTheme({ 
      colors: { 
        ...themeState.colors,
        TEXT_PRIMARY: primaryText,
        ...(secondaryText && { TEXT_SECONDARY: secondaryText }),
        ...(mutedText && { TEXT_MUTED: mutedText }),
      } 
    });
  };

  const updatePrimaryOpacity = (opacity: number) => {
    saveTheme({
      opacity: {
        ...themeState.opacity,
        primary: opacity,
      },
    });
  };

  const updateBackgroundOpacity = (opacity: number) => {
    saveTheme({
      opacity: {
        ...themeState.opacity,
        background: opacity,
      },
    });
  };

  const resetTheme = () => {
    setThemeState(DEFAULT_THEME_STATE);
    CookieManager.removeItem(STORAGE_KEY);
  };

  const toggleDebugMode = async () => {
    const newDebugMode = !isDebugMode;
    setIsDebugMode(newDebugMode);
    try {
      await CookieManager.saveItem('colorDebugMode', JSON.stringify(newDebugMode));
    } catch (error) {
      console.log('Failed to save debug mode:', error);
    }
  };

  return {
    theme,
    themeState,
    isDebugMode,
    updatePrimaryColor,
    updateBackgroundColor,
    updateAllColors,
    updateTextColors,
    updatePrimaryOpacity,
    updateBackgroundOpacity,
    resetTheme,
    toggleDebugMode,
    // 导出颜色辅助函数
    lightenColor,
    darkenColor,
    hexToRgba,
  };
};