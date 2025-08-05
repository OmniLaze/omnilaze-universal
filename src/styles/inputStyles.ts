import { StyleSheet, Platform } from 'react-native';
import { COLORS, LAYOUT } from '../constants';

// 创建平台特定的阴影样式
const createShadowStyle = (shadowColor: string, shadowOffset: {width: number, height: number}, shadowOpacity: number, shadowRadius: number, elevation: number) => {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px rgba(0, 0, 0, ${shadowOpacity})`,
    };
  }
  return {
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
    elevation,
  };
};

// 创建动态输入样式函数
export const createInputStyles = (theme: any = COLORS) => StyleSheet.create({
  inputSection: {
    marginTop: 8, // 从16减少到8
    marginBottom: 20,
    marginLeft: 0, // 移除左边距，因为现在头像独立放置
  },
  simpleInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.WHITE,
    borderWidth: 0,
    borderRadius: LAYOUT.BORDER_RADIUS,
    paddingHorizontal: 16,
    paddingVertical: 2,
    minHeight: 56,
    width: '100%',
    ...createShadowStyle(theme.SHADOW, { width: 0, height: 4 }, 0.06, 6, 2),
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
      outlineWidth: 0,
    }),
  } as any,
  simpleInputIcon: {
    marginRight: 12,
    flexShrink: 0,
    opacity: 0.6,
  },
  simpleTextInput: {
    flex: 1,
    fontSize: 18,
    color: theme.TEXT_PRIMARY,
    paddingVertical: 16,
    paddingHorizontal: 0,
    fontWeight: '400',
    letterSpacing: 0.5,
    borderWidth: 0,
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
      outlineWidth: 0,
    }),
  } as any,
  disabledSimpleInputWrapper: {
    backgroundColor: '#F8F9FA',
    opacity: 0.8,
  },
  errorSimpleInputWrapper: {
    backgroundColor: theme.ERROR_BACKGROUND,
    ...createShadowStyle(theme.ERROR, { width: 0, height: 0 }, 0.15, 8, 4),
  },
  simpleInputClearButton: {
    padding: 4,
    marginLeft: 8,
  },
  simpleInputEditButton: {
    padding: 4,
    marginLeft: 8,
  },
  multilineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: theme.ERROR,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '400',
  },
});

// 保持默认导出以向后兼容
export const inputStyles = createInputStyles();

export const createBudgetStyles = (theme: any = COLORS) => StyleSheet.create({
  budgetOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    marginLeft: 0, // 移除左边距，因为现在头像独立放置
  },
  budgetOptionButton: {
    backgroundColor: theme.WHITE,
    borderWidth: 1,
    borderColor: theme.BORDER,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedBudgetOptionButton: {
    backgroundColor: theme.PRIMARY_WITH_OPACITY || theme.PRIMARY,
    borderColor: theme.PRIMARY,
  },
  budgetOptionText: {
    fontSize: 28,
    fontWeight: '500',
    color: theme.TEXT_PRIMARY,
  },
  selectedBudgetOptionText: {
    color: theme.WHITE,
  },
});

// 保持默认导出以向后兼容
export const budgetStyles = createBudgetStyles();

export const createButtonStyles = (theme: any = COLORS) => StyleSheet.create({
  simpleButton: {
    borderRadius: LAYOUT.BORDER_RADIUS,
    paddingHorizontal: 32, // 从24增加到32，给更多横向空间
    paddingVertical: 14,
    minWidth: 120, // 添加最小宽度确保文字不被压缩
    alignItems: 'center', // 确保文字居中
    alignSelf: 'flex-start',
    marginTop: 8, // 从12减少到8
    marginLeft: 0, // 移除左边距，因为现在头像独立放置
    ...createShadowStyle(theme.SHADOW, { width: 0, height: 4 }, 0.08, 6, 2),
  },
  activeSimpleButton: {
    backgroundColor: theme.PRIMARY_WITH_OPACITY || theme.PRIMARY,
    ...createShadowStyle(theme.PRIMARY, { width: 0, height: 4 }, 0.12, 8, 3),
  },
  disabledSimpleButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...createShadowStyle('#000', { width: 0, height: 0 }, 0, 0, 0),
  },
  simpleButtonText: {
    fontSize: 21,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeSimpleButtonText: {
    color: theme.WHITE,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  disabledSimpleButtonText: {
    color: '#94A3B8',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  nextSimpleButton: {
    backgroundColor: theme.PRIMARY_WITH_OPACITY || theme.PRIMARY,
    borderRadius: 8,
    paddingHorizontal: 28, // 从20增加到28
    paddingVertical: 12,
    minWidth: 120, // 添加最小宽度
    alignItems: 'center', // 确保文字居中
    alignSelf: 'flex-start',
    marginTop: 4, // 从8减少到4
    marginLeft: 0, // 移除左边距，因为现在头像独立放置
  },
  nextSimpleButtonText: {
    color: theme.WHITE,
    fontSize: 21,
    fontWeight: '500',
    textAlign: 'center',
  },
});

// 保持默认导出以向后兼容
export const buttonStyles = createButtonStyles();