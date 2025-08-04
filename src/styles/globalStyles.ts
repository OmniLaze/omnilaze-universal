import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS, LAYOUT } from '../constants';

const { width, height } = Dimensions.get('window');

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
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
});

export const progressStyles = StyleSheet.create({
  progressContainer: {
    position: width > 768 ? 'absolute' : 'relative',
    top: width > 768 ? 130 : 0,
    left: width > 768 ? 100 : 0,
    zIndex: 10,
    width: width > 768 ? 120 : '100%',
    marginBottom: width > 768 ? 0 : 16,
    paddingHorizontal: width > 768 ? 0 : 16,
    backgroundColor: width > 768 ? 'transparent' : COLORS.WHITE,
    paddingVertical: width > 768 ? 0 : 12,
    borderBottomWidth: width > 768 ? 0 : 1,
    borderBottomColor: width > 768 ? 'transparent' : COLORS.BORDER,
  },
  progressSteps: {
    gap: width > 768 ? 16 : 12,
    flexDirection: width > 768 ? 'column' : 'row',
    justifyContent: width > 768 ? 'flex-start' : 'space-between',
    alignItems: width > 768 ? 'flex-start' : 'center',
  },
  stepItem: {
    flexDirection: width > 768 ? 'row' : 'column',
    alignItems: 'center',
    gap: width > 768 ? 12 : 4,
    flex: width > 768 ? 0 : 1,
  },
  activeStep: {
    width: 12,
    height: 12,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStepInner: {
    width: 6,
    height: 6,
    backgroundColor: COLORS.WHITE,
    borderRadius: 3,
  },
  inactiveStep: {
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    borderRadius: 6,
  },
  activeStepText: {
    fontSize: width > 768 ? 14 : 12,
    fontWeight: '500',
    color: COLORS.PRIMARY,
    textAlign: 'center',
  },
  inactiveStepText: {
    fontSize: width > 768 ? 14 : 12,
    color: COLORS.TEXT_MUTED,
    textAlign: 'center',
  },
});

export const questionStyles = StyleSheet.create({
  completedQuestionContainer: {
    marginBottom: 2,
  },
  currentQuestionCard: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    marginBottom: width > 768 ? 80 : 40, // 移动端减少底部间距
    marginTop: width > 768 ? 10 : 5, // 移动端减少顶部间距
    minHeight: width > 768 ? 200 : 150, // 移动端减小最小高度
  },
  completedQuestionRow: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  questionText: {
    fontSize: 24,
    color: COLORS.TEXT_SECONDARY, // 改为灰色
    lineHeight: 32,
    flex: 1,
    opacity: 0.7, // 添加透明度让已完成问题更淡
  },
  currentQuestionText: {
    fontSize: 24,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 32,
    flex: 1,
    fontWeight: '500',
  },
  questionTextContainer: {
    flex: 1,
  },
  cursor: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: 28,
    marginTop: 4,
    marginLeft: 16,
  },
});

export const avatarStyles = StyleSheet.create({
  avatarSimple: {
    width: LAYOUT.AVATAR_SIZE,
    height: LAYOUT.AVATAR_SIZE,
    backgroundColor: COLORS.BORDER,
    borderRadius: LAYOUT.AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 12,
  },
});

export const answerStyles = StyleSheet.create({
  completedAnswerText: {
    marginLeft: 27,
    marginTop: 2,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#E0E0E0', // 更淡的灰色边框
    opacity: 0.8, // 整体降低透明度
  },
  answerValue: {
    fontSize: 24,
    color: COLORS.TEXT_SECONDARY, // 改为灰色
    fontWeight: '400',
    lineHeight: 36,
    opacity: 0.7, // 添加透明度让已完成答案更淡
  },
  answerWithEdit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: 10,
  },
  editAnswerButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
    opacity: 0.9,
    
  },
});

export const rightContentStyles = StyleSheet.create({
  rightContent: {
    width: '100%',
    minHeight: height * 1.2,
    maxWidth: width > 768 ? 700 : '100%',
    alignSelf: 'center',
    paddingTop: width > 768 ? 90 : 16, // 减少移动端顶部内边距，因为现在进度条在文档流中
  },
});

export const loadingStyles = StyleSheet.create({
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  loadingSpinner: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingEmoji: {
    fontSize: 48,
  },
});