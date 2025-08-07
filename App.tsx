"use client"

import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  View,
  Animated,
  TouchableOpacity,
  Text,
  Dimensions,
  Easing,
  StyleSheet,
} from 'react-native';

const { height } = Dimensions.get('window');

// 导入全局CSS样式来移除焦点边框
import './src/styles/global.css';

// Components
import { ProgressSteps } from './src/components/ProgressSteps';
import { CompletedQuestion } from './src/components/CompletedQuestion';
import { CurrentQuestion } from './src/components/CurrentQuestion';
import { AuthComponent } from './src/components/AuthComponent';
import { UserMenu } from './src/components/UserMenu';
import { InviteModalWithFreeDrink } from './src/components/InviteModalWithFreeDrink';
import { FormInputContainer, FormActionButtonContainer } from './src/components/FormContainers';
import ColorPalette from './src/components/ColorPalette';
import { convertToChineseDisplay } from './src/data/checkboxOptions';

// API Services
import { checkPreferencesCompleteness, getPreferencesAsFormData } from './src/services/api';

// Utils
import { CookieManager } from './src/utils/cookieManager';

// Hooks
import { 
  useTypewriterEffect, 
  useValidation, 
  useAnimations,
  useAppState,
  useFormSteps,
  useOrderManagement
} from './src/hooks';
import { ColorThemeProvider, useTheme } from './src/contexts/ColorThemeContext';

// Data & Types
import { STEP_CONTENT } from './src/data/stepContent';
import type { AuthResult } from './src/types';

// Styles
import { createGlobalStyles, rightContentStyles, createProgressStyles, createQuestionStyles, createAvatarStyles, createAnswerStyles } from './src/styles/globalStyles';
import { TIMING, DEV_CONFIG } from './src/constants';

function LemonadeAppContent() {
  // 使用状态管理hook
  const appState = useAppState();
  
  // 颜色主题hook
  const { 
    theme, 
    themeState, 
    isDebugMode, 
    updatePrimaryColor, 
    updateBackgroundColor, 
    updateAllColors,
    updateTextColors,
    updatePrimaryOpacity, 
    updateBackgroundOpacity, 
    toggleDebugMode 
  } = useTheme();
  
  // 创建动态样式
  const globalStyles = createGlobalStyles(theme);
  const progressStyles = createProgressStyles(theme);
  const questionStyles = createQuestionStyles(theme);
  const avatarStyles = createAvatarStyles(theme);
  const answerStyles = createAnswerStyles(theme);
  
  // 解构需要的状态和函数
  const {
    // 认证状态
    isAuthenticated, setIsAuthenticated,
    authResult, setAuthResult,
    authQuestionText, setAuthQuestionText,
    isStateRestored,
    authResetTrigger, setAuthResetTrigger,
    
    // 表单状态
    address, budget, selectedAllergies, selectedPreferences, selectedFoodType,
    otherAllergyText, otherPreferenceText, showMap, isAddressConfirmed,
    selectedAddressSuggestion, currentStep, completedAnswers, editingStep,
    originalAnswerBeforeEdit, currentOrderId, currentOrderNumber,
    currentUserSequenceNumber, isOrderSubmitting, isSearchingRestaurant,
    isOrderCompleted, orderMessage, showInviteModal, isFreeOrder, showFreeDrinkModal,
    isQuickOrderMode, completedQuestionsOffset, currentPushOffset,
    
    // 状态设置函数
    setAddress, setBudget, setSelectedAllergies, setSelectedPreferences,
    setSelectedFoodType, setOtherAllergyText, setOtherPreferenceText,
    setShowMap, setIsAddressConfirmed, setSelectedAddressSuggestion,
    setCurrentStep, setCompletedAnswers, setEditingStep,
    setOriginalAnswerBeforeEdit, setCurrentOrderId, setCurrentOrderNumber,
    setCurrentUserSequenceNumber, setIsOrderSubmitting, setIsSearchingRestaurant,
    setIsOrderCompleted, setOrderMessage, setShowInviteModal, setIsFreeOrder, setShowFreeDrinkModal,
    setIsQuickOrderMode, setCompletedQuestionsOffset, setCurrentPushOffset,
    
    // 工具函数
    resetAllState
  } = appState;

  // Custom hooks - AI流式打字机效果
  const { 
    displayedText, 
    isTyping, 
    showCursor, 
    cursorOpacity, 
    streamingOpacity,
    typeText, 
    setTextDirectly, 
    clearText,
    isStreaming 
  } = useTypewriterEffect();
  const { inputError, validateInput, validatePhoneNumber, setInputError } = useValidation();
  const { 
    questionAnimations,
    answerAnimations, 
    currentQuestionAnimation,
    mapAnimation,
    emotionAnimation,
    shakeAnimation,
    inputSectionAnimation,
    triggerShake,
    changeEmotion,
    triggerQuestionFlowAnimation
  } = useAnimations();
  
  // 移除流动动画状态管理
  const [completedQuestionsHeight, setCompletedQuestionsHeight] = useState(300);
  const [singleQuestionHeight, setSingleQuestionHeight] = useState(80);
  
  // 动画系统所需的 refs - 移除不再需要的 refs
  // 移除重复的 scrollViewRef 声明，使用下面的那个
  
  // 移除位置测量辅助函数 - 已不再需要飞行动画
  
  // 简化的已完成问题状态管理
  const getEffectiveCompletedAnswers = () => {
    return { ...completedAnswers };
  };

  // 移除不再使用的流动函数
  
  // 监听已完成问题区域高度变化，更新滚动系统
  useEffect(() => {
    // 当已完成问题区域高度变化时，更新动态内容高度
    console.log('📏 已完成问题区域高度更新:', completedQuestionsHeight);
  }, [completedQuestionsHeight]);
  
  // 页面刷新时的状态恢复
  useEffect(() => {
    if (isStateRestored && Object.keys(completedAnswers).length > 0) {
      console.log('📄 页面刷新状态恢复，已完成答案数量:', Object.keys(completedAnswers).length);
    }
  }, [isStateRestored]);
  
  // 带动画的统一回答管理函数 - 直接上推动画，无飞行
  const handleAnswerSubmission = async (
    stepIndex: number, 
    answer: any, 
    options: {
      isEditing?: boolean;
      skipAnimation?: boolean;
      onComplete?: () => void;
    } = {}
  ) => {
    const { isEditing = false, skipAnimation = false, onComplete } = options;
    
    // 统一验证
    if (!validateInput(stepIndex, answer?.value).isValid) {
      triggerShake();
      return false;
    }

    // 表情变化（除非是编辑模式）
    if (!isEditing) {
      changeEmotion('🎉');
    }
    
    // 1. 立即更新数据
    setCompletedAnswers(prev => ({
      ...prev,
      [stepIndex]: answer
    }));
    
    // 2. 确保问题和答案立即可见
    if (stepIndex >= 0) {
      questionAnimations[stepIndex].setValue(1);
      answerAnimations[stepIndex].setValue(1);
    }
    
    // 3. 如果不跳过动画且不是编辑模式，执行上推动画
    if (!skipAnimation && !isEditing) {
      console.log('🎬 开始上推动画，为下一个问题腾出空间');
      const pushUpDistance = singleQuestionHeight + 10; // 上推一个问题的高度加上间距
      const newPushOffset = currentPushOffset + pushUpDistance;
      
      Animated.timing(completedQuestionsOffset, {
        toValue: completedQuestionsOffset._value - pushUpDistance,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad)
      }).start(() => {
        console.log('✅ 上推动画完成');
      });
      
      // 🔥 关键：同步更新推动偏移跟踪状态
      setCurrentPushOffset(newPushOffset);
      console.log('📊 更新推动偏移:', newPushOffset);
    }
    
    // 4. 执行完成回调
    setTimeout(() => {
      onComplete?.();
    }, 100);
    
    return true;
  };

  // 移除页面状态管理，改为流动式布局

  // 统一的步骤推进函数
  const handleStepProgression = (currentStepIndex: number) => {
    // 立即推进，无延迟
    let nextStep = currentStepIndex + 1;
    
    // 特殊步骤逻辑
    if (currentStepIndex === 1) {
      const isSelectedDrink = selectedFoodType.includes('drink');
      if (isSelectedDrink) {
        // 不论免单还是普通模式，选择奶茶都跳到预算步骤
        nextStep = 4;
      }
    }
    
    // 免单模式在预算步骤后结束流程
    if (isFreeOrder && currentStepIndex === 4) {
      // 免单流程完成，不再推进步骤
      return;
    }
    
    if (nextStep < STEP_CONTENT.length) {
      setCurrentStep(nextStep);
    }
  };
  
  // 表单步骤管理hook
  const formSteps = useFormSteps({
    // 状态值
    address, budget, selectedAllergies, selectedPreferences, selectedFoodType,
    otherAllergyText, otherPreferenceText, currentStep, editingStep, completedAnswers,
    originalAnswerBeforeEdit, isFreeOrder, isAddressConfirmed, showMap,
    selectedAddressSuggestion, isAuthenticated, authQuestionText,
    
    // 状态设置函数
    setAddress, setBudget, setSelectedAllergies, setSelectedPreferences, setSelectedFoodType,
    setOtherAllergyText, setOtherPreferenceText, setCurrentStep, setCompletedAnswers,
    setEditingStep, setOriginalAnswerBeforeEdit, setIsAddressConfirmed, setShowMap,
    setSelectedAddressSuggestion, setCurrentOrderId, setCurrentOrderNumber,
    setCurrentUserSequenceNumber, setIsOrderSubmitting, setIsSearchingRestaurant,
    
    // 动画值
    mapAnimation, answerAnimations,
    
    // 统一管理函数
    handleAnswerSubmission, handleStepProgression,
    
    // 验证和动画函数
    validateInput, triggerShake, changeEmotion
  });
  
  // 订单管理hook
  const orderManagement = useOrderManagement({
    authResult, address, selectedAllergies, selectedPreferences, budget,
    selectedFoodType, isFreeOrder, currentUserSequenceNumber,
    otherAllergyText, otherPreferenceText, selectedAddressSuggestion,
    setCurrentOrderId, setCurrentOrderNumber, setCurrentUserSequenceNumber,
    setIsOrderSubmitting, setIsSearchingRestaurant, setIsOrderCompleted,
    setCurrentStep, setCompletedAnswers, setInputError, setOrderMessage,
    triggerShake, changeEmotion, typeText
  });
  
  // ===========================================
  // 免单状态统一管理
  // ===========================================
  
  // 统一的免单管理函数
  const handleFreeDrinkClaim = () => {
    setShowFreeDrinkModal(false);
    setIsFreeOrder(true);
    setSelectedFoodType(['drink']); // 免单只能选奶茶
    setBudget('0'); // 立即设置预算为0
    setCurrentStep(0); // 重新开始流程
    setEditingStep(null);
    setCompletedAnswers({});
  };

  // 免单状态重置函数
  const resetFreeOrderState = () => {
    setIsFreeOrder(false);
    setShowFreeDrinkModal(false);
  };

  // 免单流程自动化处理
  useEffect(() => {
    if (isFreeOrder && currentStep === 1 && editingStep === null) {
      // 在食物类型步骤自动推进（已选择奶茶）- 减少延迟
      const timer = setTimeout(() => {
        formSteps.handleNext();
      }, 1000); // 减少到1秒，减少等待时间和潜在的时序冲突
      return () => clearTimeout(timer);
    }
  }, [isFreeOrder, currentStep, editingStep]);

  // 快速订单模式状态管理
  useEffect(() => {
    if (isQuickOrderMode && currentStep === 4 && isAuthenticated && !isOrderCompleted && !isSearchingRestaurant) {
      console.log('=== 快速订单模式激活 ===', {
        currentStep,
        isAuthenticated,
        completedAnswersKeys: Object.keys(completedAnswers),
        budget
      });
      
      // 触发预算步骤的问题显示
      const timer = setTimeout(() => {
        handleQuestionTransition('好的，这一顿打算花多少钱？', !!budget.trim());
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isQuickOrderMode, currentStep, isAuthenticated, isOrderCompleted, isSearchingRestaurant]);

  // 测量已完成问题容器高度
  const measureCompletedQuestionsHeight = (event?: any) => {
    if (event && event.nativeEvent) {
      const { height: measuredHeight } = event.nativeEvent.layout;
      console.log('已完成问题容器高度:', measuredHeight);
      // 修复：直接使用测量的高度，不重复添加 padding
      // padding 应该通过 CSS 样式来控制，而不是在这里累积
      setCompletedQuestionsHeight(measuredHeight);
    }
  };

  // 测量单个问题组件高度
  const measureSingleQuestionHeight = (event?: any) => {
    if (event && event.nativeEvent) {
      const { height } = event.nativeEvent.layout;
      console.log('单个问题组件高度:', height);
      setSingleQuestionHeight(height); // 保存测量到的高度
    }
  };


  // ===========================================
  // 免单状态管理结束
  // ==========================================

  // 登出处理函数
  const handleLogout = () => {
    CookieManager.clearUserSession();
    CookieManager.clearConversationState();
    localStorage.removeItem('user_id');
    localStorage.removeItem('phone_number');
    
    resetAllState();
    resetFreeOrderState(); // 使用统一的免单重置
    setInputError('');
    clearText(); // 使用简化的清空函数
    
    // 重置动画到初始状态  
    inputSectionAnimation.setValue(0);
    currentQuestionAnimation.setValue(1);
    
    setAuthResetTrigger(prev => prev + 1);
    
    // 重置滚动位置到当前问题页面
    scrollViewRef.current?.scrollTo({
      y: getCurrentPagePosition(),
      animated: false,
    });
    scrollPosition.setValue(getCurrentPagePosition());
    setFocusMode('current');
    saveFocusMode('current');
  };

  // 邀请处理函数
  const handleInvite = () => {
    setShowFreeDrinkModal(true);
  };

  // 移除ScrollView引用，不再需要
  
  // focusMode状态管理：保存到cookie
  const [focusMode, setFocusMode] = useState<'current' | 'completed'>(() => {
    // 页面加载时从localStorage恢复focusMode，默认为current
    if (Platform.OS === 'web') {
      try {
        const saved = localStorage.getItem('omnilaze_focus_mode');
        return saved === 'completed' ? 'completed' : 'current';
      } catch (error) {
        console.log('读取focusMode失败:', error);
        return 'current';
      }
    }
    return 'current';
  });
  
  // 保存focusMode到localStorage
  const saveFocusMode = (mode: 'current' | 'completed') => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem('omnilaze_focus_mode', mode);
        console.log('focusMode已保存:', mode);
      } catch (error) {
        console.log('保存focusMode失败:', error);
      }
    }
  };
  
  // 连续滚动状态管理
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollPosition, setScrollPosition] = useState(new Animated.Value(0));
  const [isScrolling, setIsScrolling] = useState(false);
  const [hasInitializedScroll, setHasInitializedScroll] = useState(false);
  
  // 滚动阈值和页面高度 - 基于动态内容高度
  const pageHeight = height - 100; // 减去状态栏和padding
  // 🔥 修正：补偿推动造成的空间损失，确保滚动能看到所有内容
  const dynamicContentHeight = completedQuestionsHeight + pageHeight + Math.abs(currentPushOffset);
  const SNAP_THRESHOLD = 200; // 使用单个问题高度作为吸附阈值
  
  // 🎯 当前问题页位置调整 - 改这个数值就能调整所有地方的当前问题页位置
  const CURRENT_PAGE_OFFSET = 167; // 向上偏移50px，让当前问题页不那么靠上
  const getCurrentPagePosition = () => completedQuestionsHeight - CURRENT_PAGE_OFFSET;
  
  // 当前滚动进度 (1 = 已完成问题页面在焦点, 0 = 当前问题页面在焦点)
  const scrollProgress = scrollPosition.interpolate({
    inputRange: [0, getCurrentPagePosition()], // 基于调整后的当前页面位置
    outputRange: [1, 0], // 滚动到顶部(0)时已完成问题在焦点(1)，滚动到底部时当前问题在焦点(0)
    extrapolate: 'clamp',
  });
  
  // 滚动处理函数
  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollPosition.setValue(offsetY);
  };
  
  // 滚动结束时的自动吸附 - 增强吸附效果
  const handleScrollEnd = (event: any) => {
    setIsScrolling(false);
    const offsetY = event.nativeEvent.contentOffset.y;
    
    // 判断应该吸附到哪个页面 - 修复逻辑重叠问题
    let targetOffset;
    
    // 计算有效的吸附阈值，避免重叠
    const effectiveThreshold = Math.min(SNAP_THRESHOLD, completedQuestionsHeight / 3);
    
    if (offsetY <= effectiveThreshold) {
      // 吸附到已完成问题页面（顶部）
      targetOffset = 0;
      setFocusMode('completed');
      saveFocusMode('completed');
    } else if (offsetY >= getCurrentPagePosition() - effectiveThreshold) {
      // 吸附到当前问题页面
      targetOffset = getCurrentPagePosition();
      setFocusMode('current');
      saveFocusMode('current');
    } else {
      // 根据距离决定吸附方向 - 中间区域
      const midPoint = getCurrentPagePosition() * 0.5; // 使用50%作为中点
      if (offsetY < midPoint) {
        targetOffset = 0;
        setFocusMode('completed');
        saveFocusMode('completed');
      } else {
        targetOffset = getCurrentPagePosition();
        setFocusMode('current');
        saveFocusMode('current');
      }
    }
    
    console.log('滚动吸附:', { 
      offsetY, 
      effectiveThreshold, 
      completedQuestionsHeight,
      currentPagePosition: getCurrentPagePosition(), 
      targetOffset, 
      SNAP_THRESHOLD 
    });
    
    // 平滑吸附动画 - 调整动画参数让吸附更明显
    scrollViewRef.current?.scrollTo({
      y: targetOffset,
      animated: true,
      // 可以考虑添加更快的动画速度
    });
  };
  
  // 程序化切换页面
  const scrollToPage = (page: 'current' | 'completed') => {
    const targetOffset = page === 'completed' ? 0 : getCurrentPagePosition();
    scrollViewRef.current?.scrollTo({
      y: targetOffset,
      animated: true,
    });
    setFocusMode(page);
    saveFocusMode(page);
  };

  
  // 处理聚焦切换手势 - 更新为滚动版本
  const handleFocusGesture = (direction: 'up' | 'down') => {
    if (direction === 'up' && focusMode === 'current' && Object.keys(completedAnswers).length > 0) {
      scrollToPage('completed');
    } 
    else if (direction === 'down' && focusMode === 'completed') {
      scrollToPage('current');
    }
  };
  
  // 程序初始化滚加在正确的页面
  useEffect(() => {
    if (!isStateRestored || hasInitializedScroll) return;
    
    // 等待打字机效果和其他初始化完成后再设置滚动位置
    // 避免在打字机效果期间触发滚动导致闪烁
    if (isTyping) return; // 如果正在打字，等待完成
    
    // 页面刷新后，默认显示当前问题页面，除非用户明确保存了completed视图
    let initialOffset;
    if (focusMode === 'completed' && Object.keys(completedAnswers).length > 0) {
      // 只有在明确保存了completed模式且有已完成答案时，才显示已完成问题页面
      initialOffset = 0;
    } else {
      // 其他情况都显示当前问题页面
      initialOffset = getCurrentPagePosition();
      // 只在需要时更新focusMode，避免不必要的状态变更
      if (focusMode !== 'current') {
        setFocusMode('current');
        saveFocusMode('current');
      }
    }
    
    console.log('📍 初始化滚动位置:', { 
      focusMode, 
      initialOffset, 
      completedQuestionsHeight,
      currentPagePosition: getCurrentPagePosition(),
      completedAnswersCount: Object.keys(completedAnswers).length,
      isTyping
    });
    
    // 延迟设置初始位置，确保 ScrollView 已经渲染且打字机效果稳定
    const timeoutId = setTimeout(() => {
      // 再次检查是否还在打字，避免干扰打字机效果
      if (!isTyping) {
        scrollViewRef.current?.scrollTo({
          y: initialOffset,
          animated: true, // 使用自然的滑动动画
        });
        scrollPosition.setValue(initialOffset);
        setHasInitializedScroll(true); // 标记已初始化，防止重复
      }
    }, isTyping ? 500 : 200); // 如果正在打字，等待更长时间
    
    return () => clearTimeout(timeoutId);
  }, [isStateRestored, completedQuestionsHeight, isTyping]);

  // AI流式问题过渡函数 - 更丝滑的现代效果
  // 防止动画冲突的状态
  const [isInputAnimating, setIsInputAnimating] = useState(false);
  
  const animateInputSection = (toValue: number, duration: number = 300) => {
    if (isInputAnimating) return; // 防止冲突
    
    setIsInputAnimating(true);
    Animated.timing(inputSectionAnimation, {
      toValue,
      duration,
      useNativeDriver: true,
    }).start(() => {
      setIsInputAnimating(false);
    });
  };

  const handleQuestionTransition = (questionText: string, hasUserInput: boolean = false) => {
    // 重置动画状态，避免冲突
    inputSectionAnimation.setValue(0);
    currentQuestionAnimation.setValue(1);
    
    if (!hasUserInput) {
      // 无用户输入：使用AI流式打字机效果
      typeText(questionText, { 
        instant: false,
        streaming: true,
        onComplete: () => {
          // 打字完成后，丝滑显示输入框
          animateInputSection(1, 300);
        }
      });
    } else {
      // 有用户输入：直接显示文本，立即显示输入框
      setTextDirectly(questionText);
      // 立即显示输入框，因为已经有用户输入
      animateInputSection(1, 200);
    }
  };

  // 当打字机效果完成后显示输入框 - 立即触发版本
  useEffect(() => {
    if (displayedText && !isTyping && editingStep === null) {
      // 检查动画值是否为0，然后显示输入框
      let currentInputValue = 0;
      const listener = inputSectionAnimation.addListener(({ value }) => {
        currentInputValue = value;
      });
      
      if (currentInputValue === 0) {
        // 打字机完成后立即显示输入框，使用统一的动画函数
        animateInputSection(1, 250);
      }
      
      // 清理监听器
      inputSectionAnimation.removeListener(listener);
    }
  }, [displayedText, isTyping, editingStep]);

  // 不再需要初始化动画，问题直接显示在顶部

  // Effects - 统一的打字机效果管理
  useEffect(() => {
    if (!isStateRestored) return;
    
    // 如果有持久化的订单消息，优先显示
    if (orderMessage && isOrderCompleted && !displayedText && !isTyping) {
      setTextDirectly(orderMessage);
      return;
    }
    
    // 未认证状态 - 显示认证问题
    if (editingStep === null && !isAuthenticated && !isTyping) {
      handleQuestionTransition(authQuestionText);
      return;
    }
    
    // 已认证状态 - 显示表单问题
    if (editingStep === null && isAuthenticated && currentStep < STEP_CONTENT.length && !completedAnswers[currentStep] && !isTyping) {
      const stepData = formSteps.getCurrentStepData();
      
      // 统一检查用户输入状态
      let hasUserInput = false;
      switch (stepData.inputType) {
        case 'address':
          hasUserInput = !!address.trim();
          break;
        case 'foodType':
          hasUserInput = selectedFoodType.length > 0;
          break;
        case 'allergy':
          hasUserInput = selectedAllergies.length > 0;
          break;
        case 'preference':
          hasUserInput = selectedPreferences.length > 0;
          break;
        case 'budget':
          hasUserInput = !!budget.trim();
          break;
      }
      
      handleQuestionTransition(stepData.message, hasUserInput);
    }
  }, [currentStep, editingStep, isAuthenticated, selectedFoodType, authQuestionText, isStateRestored, isFreeOrder]);

  // 编辑模式效果 - 使用统一的问题管理
  useEffect(() => {
    if (editingStep !== null && isStateRestored) {
      const stepData = STEP_CONTENT[editingStep];
      if (stepData) {
        handleQuestionTransition(stepData.message, true); // 编辑模式总是有用户输入
        // 编辑模式时，直接滚动到当前问题页面
        scrollToPage('current');
      }
    }
  }, [editingStep, isStateRestored]);

  // 确保已完成答案的动画状态正确设置
  useEffect(() => {
    if (!isStateRestored) return;
    
    // 当completedAnswers变化时，确保对应的answerAnimations设置为1
    Object.keys(completedAnswers).forEach(key => {
      const index = parseInt(key);
      if (index >= 0 && index < answerAnimations.length) {
        answerAnimations[index].setValue(1);
      }
    });
  }, [completedAnswers, isStateRestored]);

  // 页面刷新后编辑状态恢复逻辑
  useEffect(() => {
    if (!isStateRestored || editingStep === null) return;
    
    // 如果页面刷新后检测到有编辑状态，需要恢复编辑模式的具体值
    const answerToEdit = completedAnswers[editingStep];
    if (answerToEdit) {
      console.log('页面刷新后恢复编辑状态:', { editingStep, answerToEdit });
      
      // 如果没有 originalAnswerBeforeEdit，设置为当前答案
      if (!originalAnswerBeforeEdit) {
        setOriginalAnswerBeforeEdit(answerToEdit);
        console.log('设置编辑前原始答案:', answerToEdit);
      }
      
      // 针对地址编辑的特殊处理
      if (answerToEdit.type === 'address') {
        // 确保地址处于可编辑状态
        setIsAddressConfirmed(false);
        setShowMap(false);
        console.log('地址编辑状态恢复: isAddressConfirmed设置为false');
      }
      
      // 确保当前步骤正确
      if (currentStep !== editingStep) {
        setCurrentStep(editingStep);
        console.log('恢复编辑步骤:', editingStep);
      }
    }
  }, [isStateRestored, editingStep, completedAnswers, originalAnswerBeforeEdit]); // 监听状态恢复和编辑状态

  // 移除自动切换回当前问题的逻辑 - 只有用户手动下滑才切换

  // 鉴权成功回调 - 集成偏好系统
  const handleAuthSuccess = async (result: AuthResult) => {
    // 如果这只是手机号验证步骤，只处理答案动画，不完成认证
    if (result.isPhoneVerificationStep) {
      const phoneAnswer = { type: 'phone', value: result.phoneNumber };
      
      // 手机号作为答案，触发答案动画
      await handleAnswerSubmission(-1, phoneAnswer, { 
        isEditing: false, 
        skipAnimation: false,
        onComplete: () => {
          // 答案动画完成后，这里不需要做其他事情，验证码问题会自动显示
        }
      });
      
      return; // 提前返回，不执行完整的认证流程
    }
    
    setIsAuthenticated(true);
    setAuthResult(result);
    
    CookieManager.clearConversationState();
    CookieManager.saveUserSession(result.userId!, result.phoneNumber, result.isNewUser || false);
    
    if (result.userId) {
      localStorage.setItem('user_id', result.userId);
      localStorage.setItem('phone_number', result.phoneNumber);
    }
    
    const phoneAnswer = { type: 'phone', value: result.phoneNumber };
    
    // 检查用户偏好以决定是否启用快速下单
    try {
      if (result.userId && !result.isNewUser) {
        // 仅对老用户检查偏好
        const preferencesCheck = await checkPreferencesCompleteness(result.userId);
        
        if (preferencesCheck.success && preferencesCheck.can_quick_order) {
          // 用户有完整偏好，可以快速下单
          console.log('🚀 启用快速下单模式');
          
          // 获取偏好数据并填充表单
          const formDataResponse = await getPreferencesAsFormData(result.userId);
          
          if (formDataResponse.success && formDataResponse.has_preferences) {
            const formData = formDataResponse.form_data;
            
            // 自动填充所有表单数据
            setAddress(formData.address);
            setSelectedFoodType(formData.selectedFoodType);
            setSelectedAllergies(formData.selectedAllergies);
            setSelectedPreferences(formData.selectedPreferences);
            setBudget(formData.budget);
            setOtherAllergyText(formData.otherAllergyText || '');
            setOtherPreferenceText(formData.otherPreferenceText || '');
            setSelectedAddressSuggestion(formData.selectedAddressSuggestion);
            
            // 标记前面步骤为已完成，但不包括预算步骤
            const completedAnswers = {
              [-1]: { type: 'phone' as const, value: result.phoneNumber },
              [0]: { type: 'address' as const, value: formData.address },
              [1]: { type: 'foodType' as const, value: convertToChineseDisplay(formData.selectedFoodType) },
              [2]: { type: 'allergy' as const, value: convertToChineseDisplay(formData.selectedAllergies) },
              [3]: { type: 'preference' as const, value: convertToChineseDisplay(formData.selectedPreferences) }
              // 不包括预算步骤，让用户在预算步骤手动确认
            };
            
            // 显式清除步骤4及之后的答案，确保预算步骤显示
            const currentCompletedAnswers: any = { ...completedAnswers };
            delete currentCompletedAnswers[4];
            delete currentCompletedAnswers[5];
            
            // 批量状态更新
            setCompletedAnswers(currentCompletedAnswers);
            
            // 确保对应的答案动画设置为可见状态
            Object.keys(currentCompletedAnswers).forEach(key => {
              const index = parseInt(key);
              if (index >= 0 && index < answerAnimations.length) {
                answerAnimations[index].setValue(1);
              }
            });
            
            setIsQuickOrderMode(true); // 设置快速下单模式
            setIsOrderCompleted(false);
            setIsSearchingRestaurant(false);
            setCurrentStep(4); // 跳到预算步骤（第4步）
            
            return;
          }
        }
      }
    } catch (error) {
      console.warn('检查用户偏好时出错，使用常规流程:', error);
    }
    
    // 常规流程：新用户或没有完整偏好的老用户
    await handleAnswerSubmission(-1, phoneAnswer, {
      skipAnimation: true, // 认证不需要动画
      onComplete: () => {
        // 立即推进到第一步，无延迟
        setCurrentStep(0);
      }
    });
  };
  
  // 鉴权问题文本变化回调
  const handleAuthQuestionChange = (question: string) => {
    setAuthQuestionText(question);
  };
  
  // 鉴权错误回调
  const handleAuthError = (error: string) => {
    setInputError(error);
  };

  // 处理偏好编辑
  const handleEditPreferences = () => {
    setIsQuickOrderMode(false);
    setCurrentStep(0); // 重新开始表单流程
    
    // 保留用户数据，但让用户可以编辑
    const phoneAnswer = { type: 'phone' as const, value: authResult?.phoneNumber || '' };
    setCompletedAnswers({ [-1]: phoneAnswer });
  };

  // Render current step input
  const renderCurrentInput = () => {
    const stepData = editingStep !== null ? STEP_CONTENT[editingStep] : formSteps.getCurrentStepData();
    
    return (
      <FormInputContainer
        stepData={stepData}
        editingStep={editingStep}
        currentStep={currentStep}
        address={address}
        budget={budget}
        selectedAllergies={selectedAllergies}
        selectedPreferences={selectedPreferences}
        selectedFoodType={selectedFoodType}
        otherAllergyText={otherAllergyText}
        otherPreferenceText={otherPreferenceText}
        isAddressConfirmed={isAddressConfirmed}
        isFreeOrder={isFreeOrder}
        handleAddressChange={formSteps.handleAddressChange}
        handleSelectAddress={formSteps.handleSelectAddress}
        setBudget={setBudget}
        setSelectedAllergies={setSelectedAllergies}
        setSelectedPreferences={setSelectedPreferences}
        setSelectedFoodType={setSelectedFoodType}
        setOtherAllergyText={setOtherAllergyText}
        setOtherPreferenceText={setOtherPreferenceText}
        handleFinishEditing={formSteps.handleFinishEditing}
        handleConfirmOrder={orderManagement.handleConfirmOrder}
        inputSectionAnimation={inputSectionAnimation}
        inputError={inputError}
        isTyping={isTyping}
        renderActionButton={renderActionButton}
      />
    );
  };

  const renderActionButton = () => {
    return (
      <FormActionButtonContainer
        editingStep={editingStep}
        currentStep={currentStep}
        budget={budget}
        address={address}
        canProceed={formSteps.canProceed()}
        handleFinishEditing={formSteps.handleFinishEditing}
        handleCancelEditing={formSteps.handleCancelEditing}
        handleAddressConfirm={formSteps.handleAddressConfirm}
        handleNext={formSteps.handleNext}
        inputSectionAnimation={inputSectionAnimation}
      />
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[globalStyles.container, { backgroundColor: theme.BACKGROUND }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={theme.BACKGROUND} />
      
      {/* 移除全局动画层 - 已不再需要飞行动画 */}
      
      {/* 用户菜单 - 仅在登录后显示 */}
      {isAuthenticated && (
        <UserMenu
          isVisible={true}
          onLogout={handleLogout}
          onInvite={handleInvite}
          phoneNumber={authResult?.phoneNumber || ''}
        />
      )}
      
      {/* 临时调色板调试按钮 - 方便测试 */}
      <View style={{
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 9999,
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 10,
        borderRadius: 8,
      }}>
        <Text style={{ fontSize: 12, marginBottom: 5 }}>
          调色板开关: {DEV_CONFIG.ENABLE_COLOR_PALETTE ? '开启' : '关闭'}
        </Text>
        <Text style={{ fontSize: 12, marginBottom: 5 }}>
          调试模式: {isDebugMode ? '是' : '否'}
        </Text>
        {DEV_CONFIG.ENABLE_COLOR_PALETTE && (
          <TouchableOpacity
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: theme.PRIMARY,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
              marginTop: 5,
            }}
            onPress={toggleDebugMode}
          >
            <Text style={{ color: 'white', fontSize: 28 }}>🎨</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* 邀请免单弹窗 */}
      {authResult && (
        <InviteModalWithFreeDrink
          isVisible={showFreeDrinkModal}
          onClose={() => setShowFreeDrinkModal(false)}
          onFreeDrinkClaim={handleFreeDrinkClaim}
          userPhoneNumber={authResult.phoneNumber}
          userId={authResult.userId!}
        />
      )}
      
      {/* 进度条 - 仅在登录后显示 */}
      {isAuthenticated && (
        <ProgressSteps currentStep={currentStep} />
      )}  

      {/* 连续滚动容器 - 新的滚动体验 */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          height: dynamicContentHeight, // 使用动态计算的内容高度
        }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        bounces={false} // 禁用弹性滚动，避免超出边界
        decelerationRate={0.92} // 调整减速率，让滚动停止更快，吸附更明显
        // 暂时移除snapToOffsets，使用自定义吸附逻辑
      >
        {/* ========== 已完成问题页面（动态高度） ========== */}
        <Animated.View 
          style={[
            {
              minHeight: 200, // 最小高度，防止内容过少
              paddingTop: 100, // 给进度条留出空间
              paddingHorizontal: 16,
              paddingBottom: 20,
              justifyContent: 'flex-start',
              backgroundColor: theme.BACKGROUND, // 保持一致的背景色
              transform: [{ translateY: completedQuestionsOffset }] // 页面级别推动
            }
          ]}
          onLayout={measureCompletedQuestionsHeight} // 恢复高度测量
        >
          <View 
            style={{
              width: '100%',
              maxWidth: 500,
              alignSelf: 'center',
              flex: 1,
            }}>
            {/* Debug log: rendering completed questions */}
            {/* 已完成问题区域 */}
            {/* 显示有效的已完成问题，包括已安定的过渡问题 */}
            {Object.keys(getEffectiveCompletedAnswers()).length > 0 && (
              <>
                {/* 已完成问题列表 */}
                {Object.keys(getEffectiveCompletedAnswers())
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map((stepIndex) => {
                    const index = parseInt(stepIndex);
                    const answer = getEffectiveCompletedAnswers()[index];
                    
                    // 移除过渡问题检查逻辑
                    
                    // 为手机号问题（index: -1）提供特殊处理
                    const questionText = index === -1 ? 
                      '你的手机号码是多少？' : 
                      STEP_CONTENT[index]?.message || '';
                    
                    return (
                      <Animated.View
                        key={index}
                        onLayout={(event) => {
                          // 测量每个已完成问题的实际位置，用于流动动画目标位置计算
                          if (index === Object.keys(getEffectiveCompletedAnswers()).length - 1) {
                            const { height } = event.nativeEvent.layout;
                            setSingleQuestionHeight(height + 16); // 包括margin
                            console.log('📏 测量到单个问题高度:', height + 16);
                          }
                        }}
                        style={{
                          // 动态调节内容颜色 - 已完成问题页面的透明度
                          opacity: scrollProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.4, 1.0], // scrollProgress=0(当前问题焦点)时已完成问题半透明，scrollProgress=1(已完成问题焦点)时完全不透明
                            extrapolate: 'clamp',
                          }),
                        }}
                      >
                        <CompletedQuestion
                          question={questionText}
                          answer={answer}
                          index={index}
                          questionAnimation={index >= 0 ? (questionAnimations[index] || new Animated.Value(1)) : new Animated.Value(1)}
                          answerAnimation={index >= 0 ? (answerAnimations[index] || new Animated.Value(1)) : new Animated.Value(1)}
                          onEdit={() => formSteps.handleEditAnswer(index)}
                          formatAnswerDisplay={formSteps.formatAnswerDisplay}
                          isEditing={false} // 已完成问题区域不显示编辑表单
                          canEdit={index >= 0 && (isQuickOrderMode || !(isOrderCompleted && index === 4))}
                        />
                      </Animated.View>
                    );
                  })}
              </>
            )}
          </View>
        </Animated.View>

        {/* ========== 当前问题页面（紧贴已完成问题） ========== */}
        <Animated.View 
          style={[
            {
              height: pageHeight, // 保持完整高度
              paddingTop: 1, // 减少顶部padding，让两个页面更接近
              paddingHorizontal: 16,
              paddingBottom: 40,
              justifyContent: 'flex-start',
              backgroundColor: theme.BACKGROUND, // 保持一致的背景色
              transform: [{ translateY: completedQuestionsOffset }] // 页面级别推动
            }
          ]}
        >
          <View style={{
            width: '100%',
            maxWidth: 500,
            alignSelf: 'center',
            flex: 1,
          }}>
            {/* 当前问题内容 */}
            <Animated.View
              style={{
                flex: 1,
                // 动态调节内容颜色 - 当前问题页面的透明度
                opacity: scrollProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1.0, 0.4], // scrollProgress=0(当前问题焦点)时完全不透明，scrollProgress=1(已完成问题焦点)时半透明
                  extrapolate: 'clamp',
                }),
                // 动画期间稍微降低透明度，提供视觉反馈
                // Note: movingQuestion removed as flow animation system was simplified
              }}
            >
              {/* 未认证状态 - 显示认证组件 */}
              {!isAuthenticated && (
                <CurrentQuestion
                  displayedText={displayedText}
                  isTyping={isTyping}
                  showCursor={showCursor}
                  cursorOpacity={cursorOpacity}
                  streamingOpacity={streamingOpacity}
                  isStreaming={isStreaming()}
                  inputError={inputError}
                  currentStep={0}
                  currentQuestionAnimation={currentQuestionAnimation}
                  shakeAnimation={shakeAnimation}
                  emotionAnimation={emotionAnimation}
                >
                  <AuthComponent
                    onAuthSuccess={handleAuthSuccess}
                    onError={handleAuthError}
                    onQuestionChange={handleAuthQuestionChange}
                    animationValue={inputSectionAnimation}
                    validatePhoneNumber={validatePhoneNumber}
                    triggerShake={triggerShake}
                    changeEmotion={changeEmotion}
                    resetTrigger={authResetTrigger}
                  />
                </CurrentQuestion>
              )}

              {/* Current Question - 正常流程、搜索状态、订单完成状态显示 */}
              {isAuthenticated && editingStep === null && (
                // 如果正在搜索餐厅或订单已完成，只显示相应文本，不显示其他内容
                (isSearchingRestaurant || isOrderCompleted) ? (
                  <CurrentQuestion
                    displayedText={displayedText}
                    isTyping={isTyping}
                    showCursor={showCursor}
                    cursorOpacity={cursorOpacity}
                    streamingOpacity={streamingOpacity}
                    isStreaming={isStreaming()}
                    inputError={inputError}
                    currentStep={currentStep}
                    currentQuestionAnimation={currentQuestionAnimation}
                    shakeAnimation={shakeAnimation}
                    emotionAnimation={emotionAnimation}
                  >
                    {/* 搜索状态或订单完成状态时不显示任何输入组件或按钮 */}
                  </CurrentQuestion>
                ) : (
                  (currentStep < STEP_CONTENT.length && !completedAnswers[currentStep]) && (
                    <CurrentQuestion
                      displayedText={displayedText}
                      isTyping={isTyping}
                      showCursor={showCursor}
                      cursorOpacity={cursorOpacity}
                      streamingOpacity={streamingOpacity}
                      isStreaming={isStreaming()}
                      inputError={inputError}
                      currentStep={editingStep !== null ? editingStep : currentStep}
                      currentQuestionAnimation={currentQuestionAnimation}
                      shakeAnimation={shakeAnimation}
                      emotionAnimation={emotionAnimation}
                    >
                      {/* Input Section */}
                      {renderCurrentInput()}

                      {/* Action Button */}
                      {renderActionButton()}
                    </CurrentQuestion>
                  )
                )
              )}

              {/* 编辑模式 - 当有编辑步骤时显示 */}
              {editingStep !== null && (
                <CurrentQuestion
                  displayedText={displayedText}
                  isTyping={isTyping}
                  showCursor={showCursor}
                  cursorOpacity={cursorOpacity}
                  streamingOpacity={streamingOpacity}
                  isStreaming={isStreaming()}
                  inputError={inputError}
                  currentStep={editingStep}
                  currentQuestionAnimation={currentQuestionAnimation}
                  shakeAnimation={shakeAnimation}
                  emotionAnimation={emotionAnimation}
                >
                  {/* Input Section */}
                  {renderCurrentInput()}

                  {/* Action Button */}
                  {renderActionButton()}
                </CurrentQuestion>
              )}
            </Animated.View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* 移除过渡问题组件 - 不再需要动画渲染 */}

      {/* 调色板调试工具 */}
      {DEV_CONFIG.ENABLE_COLOR_PALETTE && isDebugMode && (
        <ColorPalette
          primaryColor={theme.PRIMARY}
          backgroundColor={theme.BACKGROUND}
          primaryOpacity={themeState.opacity.primary}
          backgroundOpacity={themeState.opacity.background}
          onPrimaryColorChange={updatePrimaryColor}
          onBackgroundColorChange={updateBackgroundColor}
          onPrimaryOpacityChange={updatePrimaryOpacity}
          onBackgroundOpacityChange={updateBackgroundOpacity}
          onTextColorsChange={updateTextColors}
          onAllColorsChange={(colors) => updateAllColors(colors)}
          onClose={() => toggleDebugMode()}
        />
      )}

      {/* 调色板开关按钮 */}
      {DEV_CONFIG.ENABLE_COLOR_PALETTE && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: theme.PRIMARY,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 6,
            zIndex: isDebugMode ? 999 : 1001,
          }}
          onPress={toggleDebugMode}
        >
          <Text style={{ color: 'white', fontSize: 24 }}>🎨</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

export default function LemonadeApp() {
  return (
    <ColorThemeProvider>
      <LemonadeAppContent />
    </ColorThemeProvider>
  );
}