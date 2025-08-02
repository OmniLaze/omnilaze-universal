"use client"

import React, { useEffect, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  View,
  Animated,
} from 'react-native';

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
    triggerShake,
    changeEmotion 
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
      Animated.spring(answerAnimations[stepIndex], {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: false,
      }).start(() => {
        onComplete?.();
      });
    } else {
      onComplete?.();
    }
    
    return true;
  };

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
    
    setAuthResetTrigger(prev => prev + 1);
  };

  // 邀请处理函数
  const handleInvite = () => {
    setShowFreeDrinkModal(true);
  };

  const scrollViewRef = useRef<any>(null);

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
    if (displayedText && !isTyping && editingStep === null && inputSectionAnimation._value === 0) {
      // 打字机完成后立即显示输入框，无延迟
      Animated.spring(inputSectionAnimation, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: false,
      }).start();
    }
  }, [displayedText, isTyping, editingStep]);

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
      }
    }
  }, [editingStep, isStateRestored]);

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
            
            setCompletedAnswers(completedAnswers);
            setCurrentStep(4); // 跳到预算步骤（第4步）
            setIsQuickOrderMode(true); // 设置快速下单模式
            
            // 强制显示预算步骤的问题文本
            setTimeout(() => {
              handleQuestionTransition('好的，这一顿打算花多少钱？', !!budget.trim());
            }, 100);
            
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

      <ScrollView 
        ref={scrollViewRef}
        style={globalStyles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          globalStyles.scrollContent
        ]}
      >
        <View style={globalStyles.mainContent}>
          <View style={globalStyles.contentContainer}>
            <View style={rightContentStyles.rightContent}>
              {/* Completed Questions */}
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
                      isEditing={isCurrentlyEditing}
                      editingInput={isCurrentlyEditing ? renderCurrentInput() : undefined}
                      editingButtons={isCurrentlyEditing ? renderActionButton() : undefined}
                      canEdit={index >= 0 && (isQuickOrderMode || !(isOrderCompleted && index === 4))} // 手机号（index: -1）不可编辑，快速下单模式下所有步骤可编辑，普通模式下订单完成后预算步骤不可编辑
                    />
                  );
                })}

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
                      {/* Map Container - 地址确认时显示（现在是第0步） - 已注释 */}
                      {/* {showMap && (currentStep === 0 || editingStep === 0) && editingStep === null && (
                        <Animated.View 
                          style={[
                            {
                              opacity: mapAnimation,
                              transform: [{
                                translateY: mapAnimation.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [16, 0],
                                }),
                              }],
                            },
                          ]}
                        >
                          <View style={{ backgroundColor: '#ffffff', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
                            <MapComponent showMap={showMap} mapAnimation={mapAnimation} />
                          </View>
                        </Animated.View>
                      )} */}

                      {/* Input Section */}
                      {renderCurrentInput()}

                      {/* Action Button */}
                      {renderActionButton()}
                    </CurrentQuestion>
                  )
                )
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}