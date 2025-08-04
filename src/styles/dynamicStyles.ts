import { StyleSheet, Dimensions, Platform } from 'react-native';
import { LAYOUT } from '../constants';

const { width, height } = Dimensions.get('window');

interface ColorTheme {
  PRIMARY: string;
  PRIMARY_LIGHT: string;
  PRIMARY_DARK: string; 
  BACKGROUND: string;
  WHITE: string;
  BLACK: string;
  TEXT_PRIMARY: string;
  TEXT_SECONDARY: string;
  TEXT_MUTED: string;
  TEXT_INVERSE: string;
  SUCCESS: string;
  SUCCESS_LIGHT: string;
  ERROR: string;
  ERROR_BACKGROUND: string;
  WARNING: string;
  WARNING_BACKGROUND: string;
  WARNING_BORDER: string;
  WARNING_TEXT: string;
  INFO: string;
  INFO_LIGHT: string;
  GRAY_50: string;
  GRAY_100: string;
  GRAY_200: string;
  GRAY_300: string;
  GRAY_400: string;
  GRAY_500: string;
  GRAY_600: string;
  GRAY_700: string;
  GRAY_800: string;
  GRAY_900: string;
  BORDER: string;
  BORDER_LIGHT: string;
  SHADOW: string;
  CARD_BACKGROUND: string;
  DISABLED_BACKGROUND: string;
  DISABLED_TEXT: string;
  PLACEHOLDER_TEXT: string;
  OVERLAY: string;
  OVERLAY_LIGHT: string;
  OVERLAY_DARK: string;
  TRANSPARENT: string;
  DIVIDER: string;
  HOVER: string;
  FOCUS: string;
  SELECTED: string;
  HIGHLIGHT: string;
}

export const createDynamicStyles = (theme: ColorTheme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.BACKGROUND,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    },
    mainContent: {
      maxWidth: 1200,
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: width > 768 ? 48 : 16,
      paddingVertical: width > 768 ? 32 : 16,
      minHeight: height,
    },
    contentContainer: {
      flexDirection: 'column',
      gap: 24,
      alignItems: 'flex-start',
      justifyContent: 'center',
    },
    cardContainer: {
      backgroundColor: width > 768 ? 'transparent' : theme.WHITE,
      borderBottomWidth: width > 768 ? 0 : 1,
      borderBottomColor: width > 768 ? 'transparent' : theme.BORDER,
      paddingVertical: width > 768 ? 0 : 16,
    },
    leftSide: {
      minHeight: 50,
      justifyContent: 'center',
      alignItems: 'flex-start',
      flex: 1,
      paddingRight: 16,
    },
    leftContent: {
      backgroundColor: theme.PRIMARY,
      borderRadius: LAYOUT.BORDER_RADIUS,
      paddingHorizontal: 20,
      paddingVertical: 16,
      maxWidth: width * 0.75,
      alignSelf: 'flex-start',
    },
    rightSide: {
      minHeight: 50,
      justifyContent: 'center',
      alignItems: 'flex-end',
      flex: 1,
      paddingLeft: 16,
    },
    rightContent: {
      backgroundColor: theme.WHITE,
      borderWidth: 1,
      borderColor: theme.BORDER,
      borderRadius: LAYOUT.BORDER_RADIUS,
      paddingHorizontal: 20,
      paddingVertical: 16,
      maxWidth: width * 0.75,
      alignSelf: 'flex-end',
    },
    questionText: {
      fontSize: 16,
      lineHeight: LAYOUT.QUESTION_LINE_HEIGHT,
      color: theme.PRIMARY,
      fontWeight: '500',
    },
    answerText: {
      fontSize: 16,
      lineHeight: LAYOUT.ANSWER_LINE_HEIGHT,
      color: theme.TEXT_MUTED,
    },
    currentAnswerText: {
      fontSize: 16,
      lineHeight: LAYOUT.ANSWER_LINE_HEIGHT,
      color: theme.TEXT_SECONDARY,
      fontWeight: '500',
    },
    phoneAnswerText: {
      fontSize: 16,
      lineHeight: LAYOUT.ANSWER_LINE_HEIGHT,
      color: theme.TEXT_PRIMARY,
      fontWeight: '500',
    },
    editButton: {
      color: theme.PRIMARY,
      fontSize: 14,
      fontWeight: '500',
      textDecorationLine: 'underline',
    },
    errorText: {
      color: theme.ERROR,
      fontSize: 14,
      marginTop: 8,
      textAlign: 'center',
    },
    loadingContainer: {
      paddingVertical: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    separator: {
      height: 1,
      backgroundColor: theme.BORDER,
      marginVertical: 12,
    },
    completedAnswerText: {
      fontSize: 16,
      lineHeight: LAYOUT.ANSWER_LINE_HEIGHT,
      color: theme.TEXT_SECONDARY,
      fontWeight: '500',
    },
  });
};

export const createRightContentStyles = (theme: ColorTheme) => {
  return StyleSheet.create({
    container: {
      alignItems: 'flex-end',
      paddingLeft: 16,
    },
    content: {
      backgroundColor: theme.WHITE,
      borderRadius: LAYOUT.BORDER_RADIUS,
      paddingHorizontal: 20,
      paddingVertical: 16,
      maxWidth: width * 0.75,
      alignSelf: 'flex-end',
      minHeight: 50,
      justifyContent: 'center',
    },
    text: {
      fontSize: 16,
      lineHeight: LAYOUT.ANSWER_LINE_HEIGHT,
      color: theme.TEXT_PRIMARY,
      textAlign: 'right',
    },
  });
};

// 快捷颜色样式生成器
export const createColorStyles = (theme: ColorTheme) => ({
  // 背景颜色
  bgPrimary: { backgroundColor: theme.PRIMARY },
  bgPrimaryLight: { backgroundColor: theme.PRIMARY_LIGHT },
  bgPrimaryDark: { backgroundColor: theme.PRIMARY_DARK },
  bgSecondary: { backgroundColor: theme.GRAY_100 },
  bgSuccess: { backgroundColor: theme.SUCCESS },
  bgSuccessLight: { backgroundColor: theme.SUCCESS_LIGHT },
  bgError: { backgroundColor: theme.ERROR },
  bgErrorLight: { backgroundColor: theme.ERROR_BACKGROUND },
  bgWarning: { backgroundColor: theme.WARNING },
  bgWarningLight: { backgroundColor: theme.WARNING_BACKGROUND },
  bgInfo: { backgroundColor: theme.INFO },
  bgInfoLight: { backgroundColor: theme.INFO_LIGHT },
  bgWhite: { backgroundColor: theme.WHITE },
  bgGray: { backgroundColor: theme.GRAY_200 },
  bgCard: { backgroundColor: theme.CARD_BACKGROUND },
  
  // 文本颜色
  colorPrimary: { color: theme.PRIMARY },
  colorSecondary: { color: theme.TEXT_SECONDARY },
  colorMuted: { color: theme.TEXT_MUTED },
  colorInverse: { color: theme.TEXT_INVERSE },
  colorSuccess: { color: theme.SUCCESS },
  colorError: { color: theme.ERROR },
  colorWarning: { color: theme.WARNING },
  colorWarningText: { color: theme.WARNING_TEXT },
  colorInfo: { color: theme.INFO },
  
  // 边框颜色
  borderPrimary: { borderColor: theme.PRIMARY },
  borderGray: { borderColor: theme.BORDER },
  borderLight: { borderColor: theme.BORDER_LIGHT },
  borderError: { borderColor: theme.ERROR },
  borderSuccess: { borderColor: theme.SUCCESS },
  borderWarning: { borderColor: theme.WARNING_BORDER },
});

// 常用组合样式
export const createCommonStyles = (theme: ColorTheme) => StyleSheet.create({
  // 卡片样式
  card: {
    backgroundColor: theme.WHITE,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.BORDER,
    shadowColor: theme.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // 警告提示框
  warningBox: {
    backgroundColor: theme.WARNING_BACKGROUND,
    borderWidth: 1,
    borderColor: theme.WARNING_BORDER,
    borderRadius: 8,
    padding: 16,
  },
  
  // 成功提示框
  successBox: {
    backgroundColor: theme.SUCCESS_LIGHT,
    borderWidth: 1,
    borderColor: theme.SUCCESS,
    borderRadius: 8,
    padding: 16,
  },
  
  // 错误提示框
  errorBox: {
    backgroundColor: theme.ERROR_BACKGROUND,
    borderWidth: 1,
    borderColor: theme.ERROR,
    borderRadius: 8,
    padding: 16,
  },
  
  // 信息提示框
  infoBox: {
    backgroundColor: theme.INFO_LIGHT,
    borderWidth: 1,
    borderColor: theme.INFO,
    borderRadius: 8,
    padding: 16,
  },
  
  // 主按钮
  primaryButton: {
    backgroundColor: theme.PRIMARY,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // 次要按钮
  secondaryButton: {
    backgroundColor: theme.GRAY_100,
    borderWidth: 1,
    borderColor: theme.BORDER,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // 幽灵按钮
  ghostButton: {
    backgroundColor: theme.TRANSPARENT,
    borderWidth: 1,
    borderColor: theme.PRIMARY,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // 危险按钮
  dangerButton: {
    backgroundColor: theme.ERROR,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // 禁用按钮
  disabledButton: {
    backgroundColor: theme.DISABLED_BACKGROUND,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // 输入框
  textInput: {
    backgroundColor: theme.WHITE,
    borderWidth: 1,
    borderColor: theme.BORDER,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.TEXT_PRIMARY,
  },
  
  // 聚焦输入框
  textInputFocused: {
    borderColor: theme.FOCUS,
    borderWidth: 2,
  },
  
  // 错误输入框
  textInputError: {
    borderColor: theme.ERROR,
    borderWidth: 2,
  },
  
  // 分割线
  separator: {
    height: 1,
    backgroundColor: theme.DIVIDER,
    marginVertical: 16,
  },
  
  // 垂直分割线
  verticalSeparator: {
    width: 1,
    backgroundColor: theme.DIVIDER,
    marginHorizontal: 16,
  },
  
  // 标签
  tag: {
    backgroundColor: theme.GRAY_100,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // 主色标签
  primaryTag: {
    backgroundColor: theme.PRIMARY_LIGHT,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // 徽章
  badge: {
    backgroundColor: theme.ERROR,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  
  // 覆盖遮罩
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.OVERLAY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // 浅色覆盖遮罩
  overlayLight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.OVERLAY_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});