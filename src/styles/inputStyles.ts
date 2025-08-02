import { StyleSheet, Platform } from 'react-native';
import { COLORS, LAYOUT } from '../constants';

export const inputStyles = StyleSheet.create({
  inputSection: {
    marginTop: 16,
    marginBottom: 20,
  },
  simpleInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderWidth: 0,
    borderRadius: LAYOUT.BORDER_RADIUS,
    paddingHorizontal: 16,
    paddingVertical: 2,
    minHeight: 56,
    width: '100%',
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
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
    color: COLORS.TEXT_PRIMARY,
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
    backgroundColor: COLORS.ERROR_BACKGROUND,
    shadowColor: COLORS.ERROR,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
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
    color: COLORS.ERROR,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '400',
  },
});

export const budgetStyles = StyleSheet.create({
  budgetOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  budgetOptionButton: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedBudgetOptionButton: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  budgetOptionText: {
    fontSize: 28,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
  },
  selectedBudgetOptionText: {
    color: COLORS.WHITE,
  },
});

export const buttonStyles = StyleSheet.create({
  simpleButton: {
    borderRadius: LAYOUT.BORDER_RADIUS,
    paddingHorizontal: 32, // 从24增加到32，给更多横向空间
    paddingVertical: 14,
    minWidth: 120, // 添加最小宽度确保文字不被压缩
    alignItems: 'center', // 确保文字居中
    alignSelf: 'flex-start',
    marginTop: 12,
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  activeSimpleButton: {
    backgroundColor: COLORS.PRIMARY,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  disabledSimpleButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowOpacity: 0,
  },
  simpleButtonText: {
    fontSize: 21,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeSimpleButtonText: {
    color: COLORS.WHITE,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  disabledSimpleButtonText: {
    color: '#94A3B8',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  nextSimpleButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    paddingHorizontal: 28, // 从20增加到28
    paddingVertical: 12,
    minWidth: 120, // 添加最小宽度
    alignItems: 'center', // 确保文字居中
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  nextSimpleButtonText: {
    color: COLORS.WHITE,
    fontSize: 21,
    fontWeight: '500',
    textAlign: 'center',
  },
});