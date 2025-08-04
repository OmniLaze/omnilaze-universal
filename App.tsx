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
  PanResponder,
  Image,
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
// import { QuickOrderSummary } from './src/components/QuickOrderSummary'; // 已移除快速下单卡片
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
    isQuickOrderMode,
    
    // 状态设置函数
    setAddress, setBudget, setSelectedAllergies, setSelectedPreferences,
    setSelectedFoodType, setOtherAllergyText, setOtherPreferenceText,
    setShowMap, setIsAddressConfirmed, setSelectedAddressSuggestion,
    setCurrentStep, setCompletedAnswers, setEditingStep,
    setOriginalAnswerBeforeEdit, setCurrentOrderId, setCurrentOrderNumber,
    setCurrentUserSequenceNumber, setIsOrderSubmitting, setIsSearchingRestaurant,
    setIsOrderCompleted, setOrderMessage, setShowInviteModal, setIsFreeOrder, setShowFreeDrinkModal,
    setIsQuickOrderMode,
    
    // 工具函数
    resetAllState
  } = appState;

  // Custom hooks
  const { displayedText, isTyping, showCursor, typeText, setTextDirectly, clearText } = useTypewriterEffect();
  const { inputError, validateInput, validatePhoneNumber, setInputError } = useValidation();
  const { 
    questionAnimations,
    answerAnimations, 
    currentQuestionAnimation,
    mapAnimation,
    emotionAnimation,
    shakeAnimation,
    inputSectionAnimation,
    completedQuestionsContainerAnimation,
    newQuestionSlideInAnimation,
    triggerShake,
    changeEmotion,
    triggerPushUpAnimation
  } = useAnimations();
  
  // 统一的回答管理函数 - 必须在 useFormSteps 之前定义
  const handleAnswerSubmission = (
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
    
    // 统一表情变化（除非是编辑模式）
    if (!isEditing) {
      changeEmotion('🎉');
    }
    
    // 统一保存答案
    setCompletedAnswers(prev => ({
      ...prev,
      [stepIndex]: answer
    }));
    
    // 统一动画处理
    if (!skipAnimation) {
      if (stepIndex >= 0) {
        // 先重置问题和答案动画值为0，确保从下方开始动画
        questionAnimations[stepIndex].setValue(0);
        answerAnimations[stepIndex].setValue(0);
        
        // 先播放问题动画，然后播放答案动画
        Animated.spring(questionAnimations[stepIndex], {
          toValue: 1,
          tension: 80,
          friction: 10,
          useNativeDriver: false,
        }).start(() => {
          // 问题动画完成后，开始答案动画
          Animated.spring(answerAnimations[stepIndex], {
            toValue: 1,
            tension: 80,  // 增加tension让动画更快更有弹性
            friction: 10, // 增加friction让动画更自然
            useNativeDriver: false,
          }).start(() => {
            // 答案动画完成后，模拟下滑手势切换到新问题
            setTimeout(() => {
              // 先上滑到已完成问题区域
              if (focusMode === 'current' && Object.keys(completedAnswers).length > 0) {
                handleFocusGesture('up');
                
                // 然后模拟下滑手势回到当前问题，触发新问题的打字机动画
                setTimeout(() => {
                  handleFocusGesture('down');
                }, 300); // 300ms后下滑
              }
              
              // 执行完成回调
              onComplete?.();
            }, 500); // 500ms的停顿让用户能够看到答案
          });
        });
      } else {
        // 特殊步骤（如手机号，索引-1）的处理
        setTimeout(() => {
          // 模拟下滑手势切换到新问题
          if (focusMode === 'current' && Object.keys(completedAnswers).length > 0) {
            handleFocusGesture('up');
            
            // 然后模拟下滑手势回到当前问题，触发新问题的打字机动画
            setTimeout(() => {
              handleFocusGesture('down');
            }, 300); // 300ms后下滑
          }
          
          // 执行完成回调
          onComplete?.();
        }, 500); // 保持相同的延迟
      }
    } else {
      onComplete?.();
    }
    
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
      const { height } = event.nativeEvent.layout;
      console.log('已完成问题容器高度:', height);
      console.log('头像将定位在top:', Math.max(height + 30, 120));
      setCompletedQuestionsHeight(height + 20); // 加上一些padding
    }
  };

  // 测量单个问题组件高度
  const measureSingleQuestionHeight = (event?: any) => {
    if (event && event.nativeEvent) {
      const { height } = event.nativeEvent.layout;
      console.log('单个问题组件高度:', height);
      setSingleQuestionHeight(height + 10); // 加上一些margin
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
    
    // 重置所有动画到初始状态  
    mapAnimation.setValue(0);
    inputSectionAnimation.setValue(0);
    currentQuestionAnimation.setValue(1);
    completedQuestionsContainerAnimation.setValue(0);
    newQuestionSlideInAnimation.setValue(0); // 重置到下方位置
    focusTransition.setValue(0);
    autoPushOffset.setValue(0); // 重置自动推送偏移量
    gestureTransition.setValue(0); // 重置手势动画值
    
    setAuthResetTrigger(prev => prev + 1);
  };

  // 邀请处理函数
  const handleInvite = () => {
    setShowFreeDrinkModal(true);
  };

  // 移除ScrollView引用，不再需要
  
  // 状态管理：聚焦模式
  const [focusMode, setFocusMode] = useState<'current' | 'completed'>('current'); // 聚焦模式：当前问题或已完成问题
  const [focusTransition] = useState(new Animated.Value(0)); // 0=聚焦当前问题, 1=聚焦已完成问题
  const [autoPushOffset] = useState(new Animated.Value(0)); // 自动推送偏移量
  const [gestureTransition] = useState(new Animated.Value(0)); // 新增：手势跟随动画值
  const [completedQuestionsHeight, setCompletedQuestionsHeight] = useState(height * 0.3); // 已完成问题容器的实际高度
  const [singleQuestionHeight, setSingleQuestionHeight] = useState(120); // 单个问题组件的高度
  const completedQuestionsRef = useRef<View>(null); // 用于测量已完成问题容器高度
  const singleQuestionRef = useRef<View>(null); // 用于测量单个问题组件高度
  
  // 手势状态管理
  const [isDragging, setIsDragging] = useState(false); // 是否正在拖拽
  
  // 切换聚焦模式
  const switchToCurrentQuestion = () => {
    setFocusMode('current');
    setIsDragging(false);
    Animated.spring(focusTransition, {
      toValue: 0,
      tension: 120, // 提高tension让动画更快响应
      friction: 12, // 增加friction减少震荡
      useNativeDriver: true, // 启用native driver提升性能
    }).start();
    
    // 重置手势动画值
    gestureTransition.setValue(0);
    
    // 重置自动推送偏移量
    autoPushOffset.setValue(0);
    
    // 模拟下滑手势后，确保当前输入状态正确显示，但不重新触发动画
    setTimeout(() => {
      // 如果有活跃的输入，确保输入组件显示
      if (isAuthenticated && editingStep === null && currentStep < STEP_CONTENT.length && !completedAnswers[currentStep]) {
        const stepData = formSteps.getCurrentStepData();
        
        // 检查用户输入状态，确保输入框显示
        let hasUserInput = false;
        switch (stepData.inputType) {
          case 'address':
            hasUserInput = !!address.trim();
            break;
          case 'foodType':
            hasUserInput = selectedFoodType.length > 0;
            break;
          case 'allergies':
            hasUserInput = selectedAllergies.length > 0 || !!otherAllergyText.trim();
            break;
          case 'preferences':
            hasUserInput = selectedPreferences.length > 0 || !!otherPreferenceText.trim();
            break;
          case 'budget':
            hasUserInput = !!budget.trim();
            break;
        }
        
        // 如果有用户输入，确保输入组件可见，但不触发完整的问题转换动画
        if (hasUserInput) {
          inputSectionAnimation.setValue(1);
        }
      } else if (isAuthenticated && editingStep !== null) {
        // 编辑模式时确保输入组件可见
        inputSectionAnimation.setValue(1);
      }
    }, 100); // 短暂延迟确保聚焦切换完成
  };
  
  const switchToCompletedQuestions = () => {
    setFocusMode('completed');
    setIsDragging(false);
    Animated.spring(focusTransition, {
      toValue: 1,
      tension: 120, // 提高tension让动画更快响应
      friction: 12, // 增加friction减少震荡
      useNativeDriver: true, // 启用native driver提升性能
    }).start();
    
    // 重置手势动画值
    gestureTransition.setValue(0);
  };

  
  // 处理聚焦切换手势
  const handleFocusGesture = (direction: 'up' | 'down') => {
    if (direction === 'up' && focusMode === 'current' && Object.keys(completedAnswers).length > 0) {
      switchToCompletedQuestions();
    } else if (direction === 'down' && focusMode === 'completed') {
      switchToCurrentQuestion();
    }
  };
  
  // 处理滚轮事件（Web特有）
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const handleWheel = (event: WheelEvent) => {
      // 检测快速滚动来触发聚焦切换
      const isQuickScroll = Math.abs(event.deltaY) > 10;
      
      if (isQuickScroll && Object.keys(completedAnswers).length > 0) {
        if (event.deltaY > 0 && focusMode === 'current') {
          // 向下滚动（向上查看内容）且聚焦在当前问题
          handleFocusGesture('up');
          event.preventDefault();
        } else if (event.deltaY < 0 && focusMode === 'completed') {
          // 向上滚动（向下查看内容）且聚焦在已完成问题
          handleFocusGesture('down');
          event.preventDefault();
        }
      }
    };
    
    document.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, [focusMode, completedAnswers]);
  
  // 添加原生触摸事件处理（Web专用）
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  
  const handleTouchStart = (event: any) => {
    const touch = event.touches[0];
    setTouchStartY(touch.clientY);
  };
  
  const handleTouchMove = (event: any) => {
    if (touchStartY === null) return;
    
    const touch = event.touches[0];
    const deltaY = touchStartY - touch.clientY; // 向上滑动为正值，向下滑动为负值
    
    // 检测快速滑动手势
    const isQuickSwipe = Math.abs(deltaY) > 50;
    
    if (isQuickSwipe && Object.keys(completedAnswers).length > 0) {
      if (deltaY > 0 && focusMode === 'current') {
        // 向上快速滑动且聚焦在当前问题
        handleFocusGesture('up');
        event.preventDefault();
      } else if (deltaY < 0 && focusMode === 'completed') {
        // 向下快速滑动且聚焦在已完成问题
        handleFocusGesture('down');
        event.preventDefault();
      }
    }
  };
  
  const handleTouchEnd = () => {
    setTouchStartY(null);
  };
  
  // 创建手势识别器用于处理滑动 - 改进版本支持平滑跟随
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => {
      return Object.keys(completedAnswers).length > 0;
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      const hasVerticalMovement = Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 5;
      return hasVerticalMovement;
    },
    onPanResponderGrant: (evt, gestureState) => {
      setIsDragging(true);
    },
    onPanResponderMove: (evt, gestureState) => {
      // 性能优化：限制更新频率，避免过于频繁的动画更新
      if (Math.abs(gestureState.dy) < 5) return; // 忽略小幅移动，减少计算
      
      // 计算手势距离（限制在合理范围内）
      const maxGestureDistance = height * 0.25; // 减少最大距离提升响应性
      const clampedDy = Math.max(-maxGestureDistance, Math.min(maxGestureDistance, gestureState.dy));
      
      // 计算手势跟随的动画值（-1到1之间）
      const gestureProgress = clampedDy / maxGestureDistance;
      
      // 根据当前聚焦模式调整手势方向
      let gestureValue;
      if (focusMode === 'current') {
        // 在当前问题模式，向上滑动（负值）应该产生正向手势值
        gestureValue = -gestureProgress;
      } else {
        // 在已完成问题模式，向下滑动（正值）应该产生负向手势值
        gestureValue = gestureProgress;
      }
      
      // 更新手势跟随动画值，使用更平滑的插值
      gestureTransition.setValue(gestureValue);
    },
    onPanResponderRelease: (evt, gestureState) => {
      setIsDragging(false);
      
      // 定义切换的临界值（降低临界值提升响应性）
      const threshold = height * 0.15; // 从20%降低到15%，让切换更敏感
      const shouldSwitch = Math.abs(gestureState.dy) > threshold;
      
      // 先重置手势跟随动画值（使用更快的动画参数）
      Animated.timing(gestureTransition, {
        toValue: 0,
        duration: 200, // 使用timing动画替代spring，更精确的控制
        useNativeDriver: true, // 启用native driver提升性能
      }).start();
      
      if (shouldSwitch) {
        // 达到临界值，执行真正的页面切换
        if (gestureState.dy < -threshold && focusMode === 'current') {
          switchToCompletedQuestions();
        } else if (gestureState.dy > threshold && focusMode === 'completed') {
          switchToCurrentQuestion();
        }
      }
    },
    onPanResponderTerminationRequest: () => {
      return false; // 不允许其他组件接管手势
    },
    onPanResponderTerminate: () => {
      setIsDragging(false);
      // 回弹手势跟随动画值
      Animated.spring(gestureTransition, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: false,
      }).start();
    },
  });

  // 统一的问题管理函数 - 简化版
  const handleQuestionTransition = (questionText: string, hasUserInput: boolean = false) => {
    // 重置动画状态
    inputSectionAnimation.setValue(0);
    currentQuestionAnimation.setValue(1);
    
    if (!hasUserInput) {
      // 无用户输入：使用打字机效果
      typeText(questionText, TIMING.TYPING_SPEED);
    } else {
      // 有用户输入：直接显示文本，然后显示输入框
      setTextDirectly(questionText);
      // 立即显示输入框，因为已经有用户输入
      inputSectionAnimation.setValue(1);
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
        // 打字机完成后立即显示输入框，无延迟
        Animated.spring(inputSectionAnimation, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: false,
        }).start();
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
        // 编辑时自动切换到当前问题聚焦模式，让编辑在当前问题区域进行
        if (focusMode !== 'current') {
          switchToCurrentQuestion();
        }
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

  // 移除自动切换回当前问题的逻辑 - 只有用户手动下滑才切换

  // 鉴权成功回调 - 集成偏好系统
  const handleAuthSuccess = async (result: AuthResult) => {
    // 如果这只是手机号验证步骤，只处理答案动画，不完成认证
    if (result.isPhoneVerificationStep) {
      const phoneAnswer = { type: 'phone', value: result.phoneNumber };
      
      // 手机号作为答案，触发答案动画
      handleAnswerSubmission(-1, phoneAnswer, { 
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
              [-1]: phoneAnswer,
              [0]: { type: 'address', value: formData.address },
              [1]: { type: 'foodType', value: convertToChineseDisplay(formData.selectedFoodType) },
              [2]: { type: 'allergy', value: convertToChineseDisplay(formData.selectedAllergies) },
              [3]: { type: 'preference', value: convertToChineseDisplay(formData.selectedPreferences) }
              // 不包括预算步骤，让用户在预算步骤手动确认
            };
            
            // 显式清除步骤4及之后的答案，确保预算步骤显示
            const currentCompletedAnswers = { ...completedAnswers };
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
    handleAnswerSubmission(-1, phoneAnswer, {
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
    const phoneAnswer = { type: 'phone', value: authResult?.phoneNumber || '' };
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

      <Animated.View 
        style={[
          globalStyles.container, 
          { 
            position: 'relative',
            transform: [
              {
                translateY: Animated.add(
                  // 主要的页面切换动画
                  focusTransition.interpolate({
                    inputRange: [0, 1],
                    outputRange: [singleQuestionHeight, -completedQuestionsHeight+singleQuestionHeight], // 修正：避免过度移动导致输入组件消失
                  }),
                  // 手势跟随动画（叠加效果）- 优化范围让手势更流畅
                  gestureTransition.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [80, 0, -80], // 增加跟随范围让手势感觉更直接
                  })
                )
              },
              {
                translateY: autoPushOffset // 自动推送偏移量
              }
            ]
          }
        ]}
        {...(Platform.OS === 'web' && {
          onTouchStart: handleTouchStart,
          onTouchMove: handleTouchMove,
          onTouchEnd: handleTouchEnd
        })}
        {...panResponder.panHandlers}
      >
        {/* ========== 已完成问题区域（在上方，紧凑布局） ========== */}
        <Animated.View 
          ref={completedQuestionsRef}
          style={{
            paddingTop: 10,
            paddingBottom: 10,
            paddingHorizontal: 16,
            // 添加基于焦点模式的透明度效果（互换：新问题页时已完成问题为黑色）
            opacity: focusTransition.interpolate({
              inputRange: [0, 1],
              outputRange: [1.0, 0.4], // 新问题模式(0)时透明度1.0（黑色），已完成问题模式(1)时透明度0.4（灰色）
            }),
          }}
          onLayout={measureCompletedQuestionsHeight}
        >
          <View style={{
            width: '100%',
            maxWidth: 500,
            alignSelf: 'center',
          }}>
            {Object.keys(completedAnswers).length > 0 && (
              <>
                {/* 已完成问题列表 */}
                {Object.keys(completedAnswers)
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map((stepIndex) => {
                    const index = parseInt(stepIndex);
                    const answer = completedAnswers[index];
                    const isCurrentlyEditing = editingStep === index;
                    
                    // 为手机号问题（index: -1）提供特殊处理
                    const questionText = index === -1 ? 
                      '你的手机号码是多少？' : 
                      STEP_CONTENT[index]?.message || '';
                    
                    return (
                      <View
                        key={index}
                        {...(index === parseInt(Object.keys(completedAnswers).sort((a, b) => parseInt(a) - parseInt(b))[0]) ? 
                          { 
                            ref: singleQuestionRef,
                            onLayout: measureSingleQuestionHeight 
                          } : {}
                        )}
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
                      </View>
                    );
                  })}
              </>
            )}
          </View>
        </Animated.View>

        {/* ========== 当前问题区域（在下方，始终可见） ========== */}
        <Animated.View style={{
          flex: 1,
          justifyContent: 'flex-start',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 10 , // 基础padding
          paddingBottom: 40,
          // 添加基于焦点模式的透明度效果（互换：已完成问题页时当前问题为黑色）
          opacity: focusTransition.interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 1.0], // 新问题模式(0)时透明度1.0（黑色），已完成问题模式(1)时透明度0.4（灰色）
          }),
        }}>
          <View style={{
            width: '100%',
            maxWidth: 500,
          }}>
            {/* 当前问题内容 */}
            {/* 未认证状态 - 显示认证组件 */}
            {!isAuthenticated && (
              <CurrentQuestion
                displayedText={displayedText}
                isTyping={isTyping}
                showCursor={showCursor}
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
          </View>
        </Animated.View>
      </Animated.View>

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