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
    isOrderCompleted, showInviteModal, isFreeOrder, showFreeDrinkModal,
    
    // 状态设置函数
    setAddress, setBudget, setSelectedAllergies, setSelectedPreferences,
    setSelectedFoodType, setOtherAllergyText, setOtherPreferenceText,
    setShowMap, setIsAddressConfirmed, setSelectedAddressSuggestion,
    setCurrentStep, setCompletedAnswers, setEditingStep,
    setOriginalAnswerBeforeEdit, setCurrentOrderId, setCurrentOrderNumber,
    setCurrentUserSequenceNumber, setIsOrderSubmitting, setIsSearchingRestaurant,
    setIsOrderCompleted, setShowInviteModal, setIsFreeOrder, setShowFreeDrinkModal,
    
    // 工具函数
    resetAllState
  } = appState;

  // Custom hooks
  const { displayedText, isTyping, showCursor, typeText, setDisplayedText } = useTypewriterEffect();
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
    
    // 验证和动画函数
    validateInput, triggerShake, changeEmotion
  });
  
  // 订单管理hook
  const orderManagement = useOrderManagement({
    authResult, address, selectedAllergies, selectedPreferences, budget,
    selectedFoodType, isFreeOrder, currentUserSequenceNumber,
    setCurrentOrderId, setCurrentOrderNumber, setCurrentUserSequenceNumber,
    setIsOrderSubmitting, setIsSearchingRestaurant, setIsOrderCompleted,
    setCurrentStep, setCompletedAnswers, setInputError,
    triggerShake, changeEmotion, typeText
  });
  
  // 免单相关处理函数
  const handleFreeDrinkClaim = () => {
    setShowFreeDrinkModal(false);
    setIsFreeOrder(true);
    setSelectedFoodType(['drink']);
    setCurrentStep(0);
    setEditingStep(null);
    setCompletedAnswers({});
  };

  // 免单流程自动化处理
  useEffect(() => {
    if (isFreeOrder && currentStep === 1 && editingStep === null) {
      const timer = setTimeout(() => {
        formSteps.handleNext();
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [isFreeOrder, currentStep, editingStep]);

  // 登出处理函数
  const handleLogout = () => {
    CookieManager.clearUserSession();
    CookieManager.clearConversationState();
    localStorage.removeItem('user_id');
    localStorage.removeItem('phone_number');
    
    resetAllState();
    setInputError('');
    setDisplayedText('');
    
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


  // Effects - 打字机效果
  useEffect(() => {
    if (!isStateRestored) return;
    
    if (editingStep === null && !isAuthenticated && !isTyping) {
      inputSectionAnimation.setValue(0);
      currentQuestionAnimation.setValue(1);
      typeText(authQuestionText, TIMING.TYPING_SPEED);
      return;
    }
    
    if (editingStep === null && isAuthenticated && currentStep < STEP_CONTENT.length && !completedAnswers[currentStep] && !isTyping) {
      const stepData = formSteps.getCurrentStepData();
      
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
      
      if (!hasUserInput) {
        inputSectionAnimation.setValue(0);
        currentQuestionAnimation.setValue(1);
        const newMessage = stepData.message;
        typeText(newMessage, TIMING.TYPING_SPEED);
      } else {
        setDisplayedText(stepData.message);
        inputSectionAnimation.setValue(1);
      }
    }
  }, [currentStep, editingStep, isAuthenticated, selectedFoodType, authQuestionText, isStateRestored]);

  // 编辑模式效果
  useEffect(() => {
    if (editingStep !== null) {
      const stepData = STEP_CONTENT[editingStep];
      setDisplayedText(stepData.message);
      inputSectionAnimation.setValue(1);
      currentQuestionAnimation.setValue(1);
    }
  }, [editingStep]);

  // 输入动画效果
  useEffect(() => {
    if (editingStep === null && displayedText && !isTyping) {
      setTimeout(() => {
        Animated.spring(inputSectionAnimation, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: false,
        }).start();
      }, TIMING.ANIMATION_DELAY);
    }
  }, [displayedText, isTyping, editingStep]);

  // 鉴权成功回调
  const handleAuthSuccess = (result: AuthResult) => {
    setIsAuthenticated(true);
    setAuthResult(result);
    setIsFreeOrder(false);
    
    CookieManager.clearConversationState();
    CookieManager.saveUserSession(result.userId!, result.phoneNumber, result.isNewUser || false);
    
    if (result.userId) {
      localStorage.setItem('user_id', result.userId);
      localStorage.setItem('phone_number', result.phoneNumber);
    }
    
    const phoneAnswer = { type: 'phone', value: result.phoneNumber };
    setCompletedAnswers({ [-1]: phoneAnswer });
    
    setTimeout(() => {
      setCurrentStep(0);
    }, 500);
  };
  
  // 鉴权问题文本变化回调
  const handleAuthQuestionChange = (question: string) => {
    setAuthQuestionText(question);
  };
  
  // 鉴权错误回调
  const handleAuthError = (error: string) => {
    setInputError(error);
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
                      canEdit={index >= 0 && !(isOrderCompleted && index === 4)} // 手机号（index: -1）不可编辑，订单完成后预算步骤（index: 4）不可编辑
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