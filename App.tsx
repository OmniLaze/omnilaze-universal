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

// Data & Types
import { STEP_CONTENT } from './src/data/stepContent';
import type { AuthResult } from './src/types';

// Styles
import { globalStyles, rightContentStyles } from './src/styles/globalStyles';
import { TIMING } from './src/constants';

export default function LemonadeApp() {
  // 使用状态管理hook
  const appState = useAppState();
  
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
    if (!skipAnimation && stepIndex >= 0) {
      // 首先播放答案出现动画
      Animated.spring(answerAnimations[stepIndex], {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: false,
      }).start(() => {
        // 答案动画完成后，直接完成
        onComplete?.();
      });
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
  
  // 切换聚焦模式
  const switchToCurrentQuestion = () => {
    setFocusMode('current');
    Animated.spring(focusTransition, {
      toValue: 0,
      tension: 60,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };
  
  const switchToCompletedQuestions = () => {
    setFocusMode('completed');
    Animated.spring(focusTransition, {
      toValue: 1,
      tension: 60,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };
  
  // 移除滚动处理函数，不再需要
  
  // 处理聚焦切换手势
  const handleFocusGesture = (direction: 'up' | 'down') => {
    if (direction === 'up' && focusMode === 'current' && Object.keys(completedAnswers).length > 0) {
      console.log('✅ 检测到上滑手势，切换到已完成问题');
      switchToCompletedQuestions();
    } else if (direction === 'down' && focusMode === 'completed') {
      console.log('✅ 检测到下滑手势，切换回当前问题');
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
        console.log('滚轮聚焦控制:', event.deltaY, '当前聚焦:', focusMode);
        
        if (event.deltaY < 0 && focusMode === 'current') {
          // 向上快速滚动且聚焦在当前问题
          handleFocusGesture('up');
          event.preventDefault();
        } else if (event.deltaY > 0 && focusMode === 'completed') {
          // 向下快速滚动且聚焦在已完成问题
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
    console.log('🟢 原生触摸开始:', touch.clientY);
  };
  
  const handleTouchMove = (event: any) => {
    if (touchStartY === null) return;
    
    const touch = event.touches[0];
    const deltaY = touchStartY - touch.clientY; // 向上滑动为正值，向下滑动为负值
    console.log('🔵 原生触摸移动:', deltaY, '当前聚焦:', focusMode);
    
    // 检测快速滑动手势
    const isQuickSwipe = Math.abs(deltaY) > 50;
    
    if (isQuickSwipe) {
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
    console.log('🔴 原生触摸结束');
    setTouchStartY(null);
  };
  
  // 创建手势识别器用于处理滑动
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => {
      console.log('onStartShouldSetPanResponder 被调用', '当前聚焦:', focusMode);
      // 当有已完成问题时才响应触摸
      return Object.keys(completedAnswers).length > 0;
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // 手势检测：垂直滑动距离大于水平滑动距离
      const hasVerticalMovement = Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 5;
      console.log('onMoveShouldSetPanResponder 手势检测:', { 
        dy: gestureState.dy, 
        dx: gestureState.dx, 
        hasVerticalMovement,
        focusMode 
      });
      return hasVerticalMovement;
    },
    onPanResponderMove: (evt, gestureState) => {
      console.log('onPanResponderMove:', gestureState.dy, 'dx:', gestureState.dx, '当前聚焦:', focusMode);
      
      // 检测快速手势
      const isQuickGesture = Math.abs(gestureState.dy) > 15;
      
      if (isQuickGesture) {
        if (gestureState.dy < 0 && focusMode === 'current') {
          // 向上快速滑动且聚焦在当前问题
          handleFocusGesture('up');
        } else if (gestureState.dy > 0 && focusMode === 'completed') {
          // 向下快速滑动且聚焦在已完成问题
          handleFocusGesture('down');
        }
      }
    },
    onPanResponderGrant: (evt, gestureState) => {
      console.log('✋ 开始触摸区域', gestureState);
    },
    onPanResponderRelease: (evt, gestureState) => {
      console.log('🔚 结束触摸，最终手势:', gestureState.dy, 'dx:', gestureState.dx);
      
      // 如果是向上滑动且聚焦在当前问题，切换到已完成问题
      if (gestureState.dy < -10 && focusMode === 'current') {
        console.log('✅ 释放时检测到上滑，切换到已完成问题');
        switchToCompletedQuestions();
      }
      // 如果是向下滑动且聚焦在已完成问题，切换回当前问题
      else if (gestureState.dy > 10 && focusMode === 'completed') {
        console.log('✅ 释放时检测到下滑，切换回当前问题');
        switchToCurrentQuestion();
      }
    },
    onPanResponderTerminationRequest: () => {
      console.log('onPanResponderTerminationRequest');
      return false; // 不允许其他组件接管手势
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

  // 移除自动切换回当前问题的逻辑 - 只有用户手动下滑才切换

  // 鉴权成功回调 - 集成偏好系统
  const handleAuthSuccess = async (result: AuthResult) => {
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
      style={globalStyles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F2" />
      
      {/* 用户菜单 - 仅在登录后显示 */}
      {isAuthenticated && (
        <UserMenu
          isVisible={true}
          onLogout={handleLogout}
          onInvite={handleInvite}
          phoneNumber={authResult?.phoneNumber || ''}
        />
      )}
      
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
            transform: [{
              translateY: focusTransition.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -(height * 0.3)], // 进一步减少移动距离
              })
            }]
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
        <View style={{
          paddingTop: 60,
          paddingBottom: 10,
          paddingHorizontal: 16,
        }}>
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
                      <CompletedQuestion
                        key={index}
                        question={questionText}
                        answer={answer}
                        index={index}
                        questionAnimation={questionAnimations[Math.max(0, index)] || new Animated.Value(1)}
                        answerAnimation={answerAnimations[Math.max(0, index)] || new Animated.Value(1)}
                        onEdit={() => formSteps.handleEditAnswer(index)}
                        formatAnswerDisplay={formSteps.formatAnswerDisplay}
                        isEditing={false} // 已完成问题区域不显示编辑表单
                        canEdit={index >= 0 && (isQuickOrderMode || !(isOrderCompleted && index === 4))}
                      />
                    );
                  })}
              </>
            )}
          </View>
        </View>

        {/* ========== 当前问题区域（在下方，始终可见） ========== */}
        <View style={{
          flex: 1,
          justifyContent: 'flex-start',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 40,
        }}>
          <View style={{
            width: '100%',
            maxWidth: 500,
          }}>
            {/* 当前问题内容 */}
            {/* 鉴权组件 - 未鉴权时显示 */}
            {!isAuthenticated && (
              <CurrentQuestion
                displayedText={displayedText}
                isTyping={isTyping}
                showCursor={showCursor}
                inputError={inputError}
                currentStep={0}
                currentQuestionAnimation={currentQuestionAnimation}
                emotionAnimation={emotionAnimation}
                shakeAnimation={shakeAnimation}
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
                  emotionAnimation={emotionAnimation}
                  shakeAnimation={shakeAnimation}
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
                    emotionAnimation={emotionAnimation}
                    shakeAnimation={shakeAnimation}
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
                emotionAnimation={emotionAnimation}
                shakeAnimation={shakeAnimation}
              >
                {/* Input Section */}
                {renderCurrentInput()}

                {/* Action Button */}
                {renderActionButton()}
              </CurrentQuestion>
            )}
          </View>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}