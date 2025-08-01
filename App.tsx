"use client"

import React, { useState, useEffect, useRef } from 'react';
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
import { BaseInput } from './src/components/BaseInput';
import { BudgetInput } from './src/components/BudgetInput';
import { MapComponent } from './src/components/MapComponent';
import { ActionButton } from './src/components/ActionButton';
import { ImageCheckbox } from './src/components/ImageCheckbox';
import { AuthComponent, AuthResult } from './src/components/AuthComponent';
import { PaymentComponent } from './src/components/PaymentComponent';
import { UserMenu } from './src/components/UserMenu';
import { InviteModal } from './src/components/InviteModal';
import { InviteModalWithFreeDrink } from './src/components/InviteModalWithFreeDrink';
import { AddressAutocomplete } from './src/components/AddressAutocomplete';


// Services - 移除鉴权相关API导入，因为AuthComponent已经包含
// import { sendVerificationCode, verifyCodeAndLogin } from './src/services/api';
import { createOrder, submitOrder } from './src/services/api';

// Utils
import { CookieManager } from './src/utils/cookieManager';

// Hooks
import { 
  useTypewriterEffect, 
  useValidation, 
  useScrollCalculation, 
  useAnimations 
} from './src/hooks';

// Data & Types
import { STEP_CONTENT } from './src/data/stepContent';
import { ALLERGY_OPTIONS, PREFERENCE_OPTIONS, FOOD_TYPE_OPTIONS } from './src/data/checkboxOptions';
import { BUDGET_OPTIONS_FOOD, BUDGET_OPTIONS_DRINK } from './src/constants';
import type { CompletedAnswers, InputFocus, Answer, AddressSuggestion } from './src/types';

// Styles
import { globalStyles, rightContentStyles } from './src/styles/globalStyles';
import { TIMING, DEV_CONFIG } from './src/constants';

export default function LemonadeApp() {
  // State - 移除鉴权相关状态，由AuthComponent管理
  const [address, setAddress] = useState('');
  // const [phoneNumber, setPhoneNumber] = useState(''); // 移除，由AuthComponent管理
  const [budget, setBudget] = useState('');
  const [allergies, setAllergies] = useState('');
  const [preferences, setPreferences] = useState('');
  // 新增复选框状态
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [selectedFoodType, setSelectedFoodType] = useState<string[]>([]);
  
  const [otherAllergyText, setOtherAllergyText] = useState('');
  const [otherPreferenceText, setOtherPreferenceText] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const [selectedAddressSuggestion, setSelectedAddressSuggestion] = useState<AddressSuggestion | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedAnswers, setCompletedAnswers] = useState<CompletedAnswers>({});
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [originalAnswerBeforeEdit, setOriginalAnswerBeforeEdit] = useState<Answer | null>(null);
  
  // 鉴权相关状态 - 由AuthComponent管理
  // const [verificationCode, setVerificationCode] = useState('');
  // const [isVerificationCodeSent, setIsVerificationCodeSent] = useState(false);
  // const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  // const [countdown, setCountdown] = useState(0);
  
  // 新增鉴权状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authResult, setAuthResult] = useState<AuthResult | null>(null);
  const [authQuestionText, setAuthQuestionText] = useState('请输入手机号获取验证码'); // 鉴权阶段的问题文本
  const [isStateRestored, setIsStateRestored] = useState(false); // 新增：跟踪状态是否已恢复
  
  // 订单相关状态
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [currentOrderNumber, setCurrentOrderNumber] = useState<string | null>(null);
  const [currentUserSequenceNumber, setCurrentUserSequenceNumber] = useState<number | null>(null);
  const [isOrderSubmitting, setIsOrderSubmitting] = useState(false);
  const [isSearchingRestaurant, setIsSearchingRestaurant] = useState(false);
  const [isOrderCompleted, setIsOrderCompleted] = useState(false); // 新增：订单完成状态

  // 用户菜单相关状态
  const [showInviteModal, setShowInviteModal] = useState(false);

  // 免单相关状态
  const [isFreeOrder, setIsFreeOrder] = useState(false);
  const [showFreeDrinkModal, setShowFreeDrinkModal] = useState(false);

  // 重置触发器，用于重置AuthComponent状态
  const [authResetTrigger, setAuthResetTrigger] = useState(0);

  // 免单相关处理函数
  const handleFreeDrinkClaim = () => {
    console.log('用户领取免单奶茶');
    setShowFreeDrinkModal(false);
    setIsFreeOrder(true);
    
    // 自动选择奶茶类型
    setSelectedFoodType(['drink']);
    
    // 跳转到地址填写步骤开始下单流程
    setCurrentStep(0);
    setEditingStep(null);
    setCompletedAnswers({});
  };

  // 免单流程自动化处理
  useEffect(() => {
    if (isFreeOrder && currentStep === 1 && editingStep === null) {
      // 在食物类型选择步骤自动选择奶茶并进入下一步
      const timer = setTimeout(() => {
        handleNext();
      }, 2200); // 给用户2.2秒看到已自动选择奶茶
      
      return () => clearTimeout(timer);
    }
  }, [isFreeOrder, currentStep, editingStep]);

  // 登出处理函数
  const handleLogout = () => {
    console.log('开始登出流程...');
    
    // 清除所有Cookie和本地存储
    CookieManager.clearUserSession();
    CookieManager.clearConversationState();
    localStorage.removeItem('user_id');
    localStorage.removeItem('phone_number');
    
    // 立即重置所有状态到初始状态
    setIsAuthenticated(false);
    setAuthResult(null);
    setCurrentStep(0);
    setCompletedAnswers({}); // 清空所有已完成的答案
    setEditingStep(null);
    setOriginalAnswerBeforeEdit(null);
    
    // 重置所有表单数据
    setAddress('');
    setBudget('');
    setSelectedAllergies([]);
    setSelectedPreferences([]);
    setSelectedFoodType([]);
    setOtherAllergyText('');
    setOtherPreferenceText('');
    setIsAddressConfirmed(false);
    setShowMap(false);
    setCurrentOrderId(null);
    setCurrentOrderNumber(null);
    setCurrentUserSequenceNumber(null);
    setIsOrderSubmitting(false);
    setIsSearchingRestaurant(false);
    setIsOrderCompleted(false); // 重置订单完成状态
    setInputError('');
    
    // 重置UI相关状态
    setShowInviteModal(false);
    setShowFreeDrinkModal(false);
    setIsFreeOrder(false);  // 重置免单状态
    setDisplayedText('');
    setAuthQuestionText('请输入手机号获取验证码');
    
    // 重置所有动画到初始状态  
    mapAnimation.setValue(0);
    inputSectionAnimation.setValue(0); // 设为0以便触发动画
    currentQuestionAnimation.setValue(1); // 设为1以便立即显示问题
    
    console.log('用户已登出，所有状态和持久化内容已清除');
    
    // 立即触发AuthComponent重置和界面更新
    setAuthResetTrigger(prev => prev + 1);
  };

  // 邀请处理函数
  const handleInvite = () => {
    setShowFreeDrinkModal(true);
  };

  // Custom hooks
  const { displayedText, isTyping, showCursor, typeText, setDisplayedText } = useTypewriterEffect();
  const { inputError, validateInput, validatePhoneNumber, setInputError } = useValidation();
  const scrollViewRef = useRef<any>(null);
  const [contentHeight, setContentHeight] = useState(800);
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

  // // 监听关键状态变化，添加调试信息
  // useEffect(() => {
  //   console.log('=== 状态变化 ===');
  //   console.log('isStateRestored:', isStateRestored);
  //   console.log('isAuthenticated:', isAuthenticated);
  //   console.log('currentStep:', currentStep);
  //   console.log('displayedText:', displayedText);
  // }, [isStateRestored, isAuthenticated, currentStep, displayedText]);

  // Effects
  // 组件加载时检查Cookie登录状态
  useEffect(() => {
    console.log('检查登录状态...');
    
    // 首先检查开发模式
    if (DEV_CONFIG.SKIP_AUTH) {
      console.log('开发模式：跳过认证');
      setIsAuthenticated(true);
      setAuthResult({
        userId: DEV_CONFIG.MOCK_USER.user_id,
        phoneNumber: DEV_CONFIG.MOCK_USER.phone_number,
        isNewUser: DEV_CONFIG.MOCK_USER.is_new_user
      });
      
      // 添加手机号作为第一个完成的答案
      const phoneAnswer = { type: 'phone', value: DEV_CONFIG.MOCK_USER.phone_number };
      setCompletedAnswers({ [-1]: phoneAnswer });
      
      // 开发模式下也需要恢复对话状态
      const savedConversation = CookieManager.getConversationState();
      console.log('开发模式-获取到的对话状态:', savedConversation);
      
      if (savedConversation) {
        setCurrentStep(savedConversation.currentStep || 0);
        setCompletedAnswers(prev => ({
          ...prev,
          ...savedConversation.completedAnswers
        }));
        setAddress(savedConversation.address || '');
        setBudget(savedConversation.budget || '');
        setSelectedAllergies(savedConversation.selectedAllergies || []);
        setSelectedPreferences(savedConversation.selectedPreferences || []);
        setSelectedFoodType(savedConversation.selectedFoodType || []);
        setOtherAllergyText(savedConversation.otherAllergyText || '');
        setOtherPreferenceText(savedConversation.otherPreferenceText || '');
        setIsAddressConfirmed(savedConversation.isAddressConfirmed || false);
        setShowMap(savedConversation.showMap || false);
        
        // 恢复地图动画状态
        if (savedConversation.showMap) {
          mapAnimation.setValue(1);
        }
        
        // 立即设置正确的问题文本和动画状态
        const stepData = STEP_CONTENT[savedConversation.currentStep || 0];
        if (stepData) {
          setDisplayedText(stepData.message);
          inputSectionAnimation.setValue(1);
          currentQuestionAnimation.setValue(1);
        }
      } else {
        // 开发模式下没有保存的对话状态，使用默认状态
        setDisplayedText(STEP_CONTENT[0].message);
        inputSectionAnimation.setValue(1);
        currentQuestionAnimation.setValue(1);
      }
      
      // 开发模式状态恢复完成
      setIsStateRestored(true);
      return; // 开发模式下直接返回
    }
    
    const savedSession = CookieManager.getUserSession();
    console.log('获取到的会话数据:', savedSession);
    
    if (savedSession) {
      // 自动登录
      console.log('自动登录成功:', savedSession);
      setIsAuthenticated(true);
      setAuthResult({
        userId: savedSession.userId,
        phoneNumber: savedSession.phoneNumber,
        isNewUser: savedSession.isNewUser
      });
      
      // 添加手机号作为第一个完成的答案
      const phoneAnswer = { type: 'phone', value: savedSession.phoneNumber };
      setCompletedAnswers({ [-1]: phoneAnswer });
      
      // 恢复对话状态
      const savedConversation = CookieManager.getConversationState();
      console.log('获取到的对话状态:', savedConversation);
      
      if (savedConversation) {
        setCurrentStep(savedConversation.currentStep || 0);
        setCompletedAnswers(prev => ({
          ...prev,
          ...savedConversation.completedAnswers
        }));
        setAddress(savedConversation.address || '');
        setBudget(savedConversation.budget || '');
        setSelectedAllergies(savedConversation.selectedAllergies || []);
        setSelectedPreferences(savedConversation.selectedPreferences || []);
        setSelectedFoodType(savedConversation.selectedFoodType || []);
        setOtherAllergyText(savedConversation.otherAllergyText || '');
        setOtherPreferenceText(savedConversation.otherPreferenceText || '');
        setIsAddressConfirmed(savedConversation.isAddressConfirmed || false);
        setShowMap(savedConversation.showMap || false);
        
        // 恢复地图动画状态
        if (savedConversation.showMap) {
          mapAnimation.setValue(1);
        }
        
        // 立即设置正确的问题文本和动画状态
        const stepData = STEP_CONTENT[savedConversation.currentStep || 0];
        if (stepData) {
          setDisplayedText(stepData.message);
          inputSectionAnimation.setValue(1);
          currentQuestionAnimation.setValue(1);
        }
      }
      
      // 生产模式状态恢复完成
      setIsStateRestored(true);
    } else {
      console.log('没有找到有效的会话数据');
      // 没有会话数据时也要设置状态恢复完成
      setIsStateRestored(true);
    }
  }, []);

  useEffect(() => {
    // 只在状态恢复完成后才处理打字机效果
    if (!isStateRestored) return;
    
    // 未认证状态下的打字机效果
    if (editingStep === null && !isAuthenticated && !isTyping) {
      inputSectionAnimation.setValue(0);
      currentQuestionAnimation.setValue(1);
      typeText(authQuestionText, TIMING.TYPING_SPEED);
      return;
    }
    
    // 已认证状态下的打字机效果
    if (editingStep === null && isAuthenticated && currentStep < STEP_CONTENT.length && !completedAnswers[currentStep] && !isTyping) {
      const stepData = getCurrentStepData();
      
      // 检查当前步骤是否已有用户输入，如果有则不重新触发打字机效果
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
        // 没有用户输入时触发打字机效果
        inputSectionAnimation.setValue(0);
        currentQuestionAnimation.setValue(1);
        const newMessage = stepData.message;
        typeText(newMessage, TIMING.TYPING_SPEED);
      } else {
        // 如果已有用户输入，直接设置正确的问题文本
        console.log('用户已有输入，直接设置正确的问题文本:', stepData.message);
        setDisplayedText(stepData.message);
        inputSectionAnimation.setValue(1);
      }
    }
  }, [currentStep, editingStep, isAuthenticated, selectedFoodType, authQuestionText, isStateRestored]); // 添加isStateRestored依赖

  // Handle editing mode - skip typewriter effect and set up immediately
  useEffect(() => {
    if (editingStep !== null) {
      const stepData = STEP_CONTENT[editingStep];
      setDisplayedText(stepData.message);
      inputSectionAnimation.setValue(1);
      currentQuestionAnimation.setValue(1);
    }
  }, [editingStep]);

  // Only trigger input animation in normal mode, not during editing
  useEffect(() => {
    if (editingStep === null && displayedText && !isTyping) {
      setTimeout(() => {
        Animated.spring(inputSectionAnimation, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: false, // Web环境下设为false
        }).start();
      }, TIMING.ANIMATION_DELAY);
    }
  }, [displayedText, isTyping, editingStep]);

  // 倒计时相关逻辑已移动到AuthComponent

  // 鉴权成功回调
  const handleAuthSuccess = (result: AuthResult) => {
    setIsAuthenticated(true);
    setAuthResult(result);
    
    // 确保开始普通订餐流程时免单状态为false
    setIsFreeOrder(false);
    
    // 清除之前的对话状态，确保普通订餐从地址步骤开始
    CookieManager.clearConversationState();
    
    // 保存用户会话到Cookie
    CookieManager.saveUserSession(result.userId!, result.phoneNumber, result.isNewUser || false);
    
    // 保存用户信息到本地存储（兼容性）
    if (result.userId) {
      localStorage.setItem('user_id', result.userId);
      localStorage.setItem('phone_number', result.phoneNumber);
    }
    
    // console.log('鉴权成功:', result);
    
    // 鉴权成功后，添加手机号作为第一个完成的答案
    const phoneAnswer = { type: 'phone', value: result.phoneNumber };
    setCompletedAnswers({ [-1]: phoneAnswer }); // 使用-1作为手机号步骤的索引
    
    // 开始订单收集流程 - 确保从地址步骤开始
    setTimeout(() => {
      setCurrentStep(0); // 设置为第一个订单收集步骤（地址）
      // useEffect会自动触发打字机效果，不需要手动调用
    }, 500);
  };

  // 保存对话状态到Cookie
  const saveConversationState = () => {
    if (isAuthenticated) {
      const conversationState = {
        currentStep,
        completedAnswers,
        address,
        budget,
        selectedAllergies,
        selectedPreferences,
        selectedFoodType,
        otherAllergyText,
        otherPreferenceText,
        isAddressConfirmed,
        showMap
      };
      CookieManager.saveConversationState(conversationState);
    }
  };

  // 监控 selectedFoodType 变化
  useEffect(() => {
    console.log('selectedFoodType 状态更新:', selectedFoodType);
  }, [selectedFoodType]);

  // 监听状态变化，自动保存对话状态
  useEffect(() => {
    if (isAuthenticated) {
      saveConversationState();
    }
  }, [currentStep, completedAnswers, address, budget, selectedAllergies, selectedPreferences, selectedFoodType, otherAllergyText, otherPreferenceText, isAddressConfirmed, showMap]);
  
  // 鉴权问题文本变化回调
  const handleAuthQuestionChange = (question: string) => {
    setAuthQuestionText(question);
    // 移除这里的typeText调用，因为现在由独立的useEffect处理
  };
  
  // 鉴权错误回调
  const handleAuthError = (error: string) => {
    setInputError(error);
  };

  // Helper functions
  const getCurrentStepData = () => {
    
    // 如果状态还没有恢复完成，返回空数据避免显示错误问题
    if (!isStateRestored) {
      console.log('状态未恢复，返回loading');
      return {
        message: '',
        inputType: 'loading'
      };
    }
    
    if (!isAuthenticated) {
      console.log('未认证，返回手机号问题');
      // 未鉴权时显示动态的鉴权问题文本
      return {
        message: authQuestionText,
        showPhoneInput: true,
        inputType: 'phone'
      };
    }
    
    // 鉴权后开始正常流程
    const stepData = STEP_CONTENT[currentStep];
    
    // 免单模式的特殊文本处理
    if (isFreeOrder && stepData) {
      switch (stepData.inputType) {
        case 'foodType':
          return {
            ...stepData,
            message: "我已经为您自动选择了奶茶 🧋"
          };
        case 'payment':
          return {
            ...stepData,
            message: "恭喜！您的免单奶茶已经不远了～"
          };
      }
    }
    
    // 特殊处理预算步骤，根据食物类型显示不同问题
    if (stepData && stepData.inputType === 'budget' && !isFreeOrder) {
      const isSelectedDrink = selectedFoodType.includes('drink');
      return {
        ...stepData,
        message: isSelectedDrink 
          ? "我可以花多少钱帮你买奶茶？" 
          : "我可以花多少钱帮你点外卖？"
      };
    }
    
    return stepData;
  };

  const getCurrentAnswer = (): Answer | null => {
    // 编辑模式下使用编辑步骤，否则使用当前步骤
    const stepToUse = editingStep !== null ? editingStep : currentStep;
    switch (stepToUse) {
      case 0: return { type: 'address', value: address };
      case 1: {
        // 将选中的食物类型ID转换为中文标签
        const foodTypeLabels = selectedFoodType.map(id => {
          const option = FOOD_TYPE_OPTIONS.find(opt => opt.id === id);
          return option ? option.label : id;
        });
        return { type: 'foodType', value: foodTypeLabels.length > 0 ? foodTypeLabels.join(', ') : '未选择' };
      }
      case 2: {
        // 将选中的过敏原ID转换为中文标签，如果选择了"其他"则包含用户输入的内容
        const allergyLabels = selectedAllergies.map(id => {
          if (id === 'other-allergy') {
            return otherAllergyText ? `其他: ${otherAllergyText}` : '其他';
          }
          const option = ALLERGY_OPTIONS.find(opt => opt.id === id);
          return option ? option.label : id;
        });
        return { type: 'allergy', value: allergyLabels.length > 0 ? allergyLabels.join(', ') : '无忌口' };
      }
      case 3: {
        // 将选中的偏好ID转换为中文标签，如果选择了"其他"则包含用户输入的内容
        const preferenceLabels = selectedPreferences.map(id => {
          if (id === 'other-preference') {
            return otherPreferenceText ? `其他: ${otherPreferenceText}` : '其他';
          }
          const option = PREFERENCE_OPTIONS.find(opt => opt.id === id);
          return option ? option.label : id;
        });
        return { type: 'preference', value: preferenceLabels.length > 0 ? preferenceLabels.join(', ') : '无特殊偏好' };
      }
      case 4: return { type: 'budget', value: budget }; // 预算
      default: return null;
    }
  };

  const formatAnswerDisplay = (answer: Answer) => {
    if (!answer) return '';
    switch (answer.type) {
      case 'address': return answer.value;
      case 'phone': return answer.value;
      case 'budget': return `¥${answer.value}`;
      case 'allergy': return answer.value || '无忌口';
      case 'preference': return answer.value || '无特殊偏好';
      case 'foodType': return answer.value || '未选择';
      default: return answer.value;
    }
  };

  const canProceed = () => {
    // 未鉴权时不能继续
    if (!isAuthenticated) {
      return false;
    }
    
    // 编辑模式下的验证逻辑
    if (editingStep !== null) {
      const stepData = STEP_CONTENT[editingStep];
      switch (stepData.inputType) {
        case 'address':
          return !!address.trim() && address.trim().length >= 5;
        case 'foodType':
          return selectedFoodType.length > 0;
        case 'allergy':
        case 'preference':
          return true;
        case 'budget':
          return !!budget.trim() && parseFloat(budget) >= 10;
        default:
          return true;
      }
    }
    
    // 正常流程的验证逻辑
    const stepData = getCurrentStepData();
    switch (stepData.inputType) {
      case 'address':
        return !!address.trim() && address.trim().length >= 5;
      case 'foodType':
        console.log('正常模式验证 foodType:', selectedFoodType.length > 0, selectedFoodType);
        return selectedFoodType.length > 0;
      case 'allergy':
      case 'preference':
        return true;
      case 'budget':
        return !!budget.trim() && parseFloat(budget) >= 10;
      default:
        return true;
    }
  };

  const handleAddressChange = (text: string) => {
    setAddress(text);
    // 如果用户手动修改地址，清除选中的建议
    if (selectedAddressSuggestion && text !== selectedAddressSuggestion.description) {
      setSelectedAddressSuggestion(null);
    }
  };

  const handleSelectAddress = (suggestion: AddressSuggestion) => {
    setSelectedAddressSuggestion(suggestion);
    setAddress(suggestion.description);
    console.log('地址已选择:', suggestion.description); // 调试日志
  };

  const handleAddressConfirm = () => {
    if (!validateInput(0, address).isValid) {
      triggerShake();
      return;
    }
    
    setIsAddressConfirmed(true);
    changeEmotion('✅');
    
    // 注释掉地图动画和显示
    // Animated.timing(mapAnimation, {
    //   toValue: 1,
    //   duration: 700,
    //   useNativeDriver: true,
    // }).start();
    
    // setTimeout(() => {
    //   setShowMap(true);
    // }, 500);
    
    // 地址确认后直接进入下一步
    setTimeout(() => {
      handleNext();
    }, 300);
  };

  const handleNext = () => {
    const currentAnswer = getCurrentAnswer();
    const inputValue = currentAnswer?.value;
    
    if (!validateInput(currentStep, inputValue).isValid) {
      triggerShake();
      return;
    }
    
    changeEmotion('🎉');
    
    setCompletedAnswers(prev => ({
      ...prev,
      [currentStep]: currentAnswer!
    }));
    
    Animated.spring(answerAnimations[currentStep], {
      toValue: 1,
      tension: 60,
      friction: 8,
      useNativeDriver: false, // Web环境下设为false
    }).start(() => {
      // 减少延迟以避免闪烁
      setTimeout(() => {
        // 实现条件跳转逻辑
        let nextStep = currentStep + 1;
        
        // 如果当前是食物类型选择步骤（步骤1）
        if (currentStep === 1) {
          const isSelectedDrink = selectedFoodType.includes('drink');
          
          if (isSelectedDrink) {
            if (isFreeOrder) {
              // 免单模式：直接跳过忌口、偏好，预算设为0，完成流程
              setBudget('0'); // 自动设置预算为0
              // 已经是最后一步，不需要进入下一步
            } else {
              // 选择了喝奶茶，跳过忌口(2)和偏好(3)，直接到预算(4)
              nextStep = 4;
            }
          }
          // 选择了吃饭，正常进入忌口步骤(2)
        }
        
        // 如果是免单模式且在预算步骤，自动设置为0，完成流程
        if (isFreeOrder && currentStep === 4) {
          setBudget('0');
          // 已经是最后一步，不需要进入下一步
          nextStep = currentStep; // 保持在当前步骤
        }
        
        if (nextStep < STEP_CONTENT.length) {
          setCurrentStep(nextStep);
        } else {
          // 已完成所有步骤，但不在这里创建订单
          // 订单创建将在支付确认时进行
          console.log('所有表单步骤已完成，等待支付确认');
        }
      }, 200);
    });
  };

  // 创建订单
  const handleCreateOrder = async () => {
    if (!authResult?.userId || !authResult?.phoneNumber) {
      setInputError('用户信息缺失，请重新登录');
      return;
    }

    const orderData = {
      address: address,
      allergies: selectedAllergies,
      preferences: selectedPreferences,
      budget: budget,
      foodType: selectedFoodType, // 添加食物类型信息
      // 免单相关信息
      isFreeOrder: isFreeOrder,
      freeOrderType: isFreeOrder ? 'invite_reward' : undefined
    };

    try {
      setIsOrderSubmitting(true);
      changeEmotion('📝');
      
      const result = await createOrder(authResult.userId, authResult.phoneNumber, orderData);
      
      if (result.success) {
        setCurrentOrderId(result.order_id || null);
        setCurrentOrderNumber(result.order_number || null);
        setCurrentUserSequenceNumber(result.user_sequence_number || null);
        console.log('订单创建成功:', result.order_number, '用户序号:', result.user_sequence_number);
        
        // 立即提交订单
        handleSubmitOrder(result.order_id!);
      } else {
        setInputError(result.message);
        triggerShake();
        changeEmotion('😰');
      }
    } catch (error) {
      setInputError('创建订单失败，请重试');
      triggerShake();
      changeEmotion('😰');
      console.error('创建订单错误:', error);
    } finally {
      setIsOrderSubmitting(false);
    }
  };

  // 提交订单
  const handleSubmitOrder = async (orderId: string) => {
    try {
      changeEmotion('🚀');
      
      const result = await submitOrder(orderId);
      
      if (result.success) {
        console.log('订单提交成功:', result.order_number);
        
        // 显示完成界面
        setCurrentStep(5);
        changeEmotion('🎉');
        
        setTimeout(() => {
          changeEmotion('🍕');
          const sequenceText = currentUserSequenceNumber ? `（您的第${currentUserSequenceNumber}单）` : '';
          typeText(`🎊 订单已提交${sequenceText}，正在为您匹配餐厅...`, TIMING.TYPING_SPEED_FAST);
        }, TIMING.COMPLETION_DELAY);
      } else {
        setInputError(result.message);
        triggerShake();
        changeEmotion('😰');
      }
    } catch (error) {
      setInputError('提交订单失败，请重试');
      triggerShake();
      changeEmotion('😰');
      console.error('提交订单错误:', error);
    }
  };

  // 确认下单后开始搜索餐厅
  const handleConfirmOrder = async () => {
    setIsSearchingRestaurant(true);
    changeEmotion('🔍');
    
    // 立即标记支付步骤为完成，隐藏PaymentComponent
    setCompletedAnswers(prev => ({
      ...prev,
      [currentStep]: { type: 'payment', value: '已确认支付' }
    }));
    
    // 显示搜索餐厅的文本
    setTimeout(() => {
      typeText('正在为你寻找合适外卖...', TIMING.TYPING_SPEED_FAST);
    }, 500);
    
    // 创建订单
    try {
      await handleCreateOrder();
      
      // 模拟搜索过程，5秒后显示完成
      setTimeout(() => {
        setIsSearchingRestaurant(false);
        setIsOrderCompleted(true); // 设置订单完成状态
        changeEmotion('🎉');
        typeText('我去下单，记得保持手机畅通，不要错过外卖员电话哦', TIMING.TYPING_SPEED_FAST);
      }, 5000);
    } catch (error) {
      setIsSearchingRestaurant(false);
      changeEmotion('😰');
      setInputError('订单创建失败，请重试');
      console.error('确认下单时创建订单失败:', error);
    }
  };

  const handleEditAddress = () => {
    setIsAddressConfirmed(false);
    setShowMap(false);
    setAddress('');
    mapAnimation.setValue(0);
  };

  const handleEditAnswer = (stepIndex: number) => {
    // 获取当前要编辑的答案
    const answerToEdit = completedAnswers[stepIndex];
    if (!answerToEdit) return;
    
    // 保存原始答案以便取消时恢复
    setOriginalAnswerBeforeEdit(answerToEdit);
    
    // 恢复编辑步骤的输入值
    switch (answerToEdit.type) {
      case 'address':
        setAddress(answerToEdit.value);
        setIsAddressConfirmed(false);
        setShowMap(false);
        mapAnimation.setValue(0);
        break;
      case 'foodType':
        // 从中文标签转换回ID
        if (answerToEdit.value !== '未选择') {
          const labels = answerToEdit.value.split(', ');
          const ids = labels.map(label => {
            const option = FOOD_TYPE_OPTIONS.find(opt => opt.label === label);
            return option ? option.id : label;
          });
          setSelectedFoodType(ids);
        }
        // 不要在"未选择"时清空selectedFoodType，保持用户已有的选择
        break;
      case 'allergy':
        setAllergies(answerToEdit.value);
        // 从中文标签转换回ID
        if (answerToEdit.value !== '无忌口') {
          const labels = answerToEdit.value.split(', ');
          const ids = labels.map(label => {
            const option = ALLERGY_OPTIONS.find(opt => opt.label === label);
            return option ? option.id : label;
          });
          setSelectedAllergies(ids);
        } else {
          setSelectedAllergies([]);
        }
        break;
      case 'preference':
        setPreferences(answerToEdit.value);
        // 从中文标签转换回ID
        if (answerToEdit.value !== '无特殊偏好') {
          const labels = answerToEdit.value.split(', ');
          const ids = labels.map(label => {
            const option = PREFERENCE_OPTIONS.find(opt => opt.label === label);
            return option ? option.id : label;
          });
          setSelectedPreferences(ids);
        } else {
          setSelectedPreferences([]);
        }
        break;
      case 'budget':
        setBudget(answerToEdit.value);
        break;
    }
    
    // 设置编辑模式（最后设置以避免useEffect冲突）
    setEditingStep(stepIndex);
  };

  const handleFinishEditing = () => {
    const currentAnswer = getCurrentAnswer();
    if (currentAnswer && editingStep !== null) {
      // 验证输入
      if (!validateInput(editingStep, currentAnswer.value).isValid) {
        triggerShake();
        return;
      }
      
      // 保存编辑后的答案
      setCompletedAnswers(prev => ({
        ...prev,
        [editingStep]: currentAnswer
      }));
      
      // 特殊处理地址步骤 - 注释掉地图显示
      if (editingStep === 0) {
        setIsAddressConfirmed(true);
        // 注释掉地图动画
        // Animated.timing(mapAnimation, {
        //   toValue: 1,
        //   duration: 700,
        //   useNativeDriver: true,
        // }).start();
        // setTimeout(() => setShowMap(true), 500);
      }
      
      // 特殊处理食物类型编辑后的步骤调整
      if (editingStep === 1) {
        const isSelectedDrink = selectedFoodType.includes('drink');
        
        // 清空预算，因为食物类型变化后预算范围可能不同
        setBudget('');
        
        // 重置与支付和订单相关的状态
        setCurrentOrderId(null);
        setCurrentOrderNumber(null);
        setCurrentUserSequenceNumber(null);
        setIsOrderSubmitting(false);
        setIsSearchingRestaurant(false);
        
        if (isSelectedDrink) {
          // 如果改选为喝奶茶，需要清除之后的忌口和偏好答案，并跳转到当前最高有效步骤
          const newCompletedAnswers = { ...completedAnswers };
          delete newCompletedAnswers[2]; // 删除忌口答案
          delete newCompletedAnswers[3]; // 删除偏好答案
          delete newCompletedAnswers[4]; // 删除预算答案
          delete newCompletedAnswers[5]; // 删除支付答案
          setCompletedAnswers({
            ...newCompletedAnswers,
            [editingStep]: currentAnswer
          });
          
          // 重置忌口和偏好选择
          setSelectedAllergies([]);
          setSelectedPreferences([]);
          
          // 如果当前步骤大于等于预算步骤(4)，跳转到预算步骤
          if (currentStep >= 4) {
            setCurrentStep(4);
          } else if (currentStep > 1) {
            // 如果当前在忌口或偏好步骤，跳转到预算步骤
            setCurrentStep(4);
          }
        } else {
          // 如果改选为吃饭，也要清除预算和支付答案重新填写
          const newCompletedAnswers = { ...completedAnswers };
          delete newCompletedAnswers[4]; // 删除预算答案
          delete newCompletedAnswers[5]; // 删除支付答案
          setCompletedAnswers({
            ...newCompletedAnswers,
            [editingStep]: currentAnswer
          });
          
          // 保持正常流程
          if (currentStep > 1 && currentStep < 4) {
            // 如果当前在忌口到偏好之间，保持当前步骤
          } else if (currentStep >= 4) {
            // 如果当前在预算或之后，回到忌口步骤继续
            setCurrentStep(2);
          }
        }
      }
      
      // 退出编辑模式
      setEditingStep(null);
      setOriginalAnswerBeforeEdit(null);
      
      // 主useEffect会自动处理步骤切换后的打字机效果，不需要手动调用
    }
  };

  const handleCancelEditing = () => {
    if (editingStep !== null && originalAnswerBeforeEdit) {
      // 恢复原始答案的输入值
      switch (originalAnswerBeforeEdit.type) {
        case 'address':
          setAddress(originalAnswerBeforeEdit.value);
          setIsAddressConfirmed(true);
          // 注释掉地图相关逻辑
          // setShowMap(true);
          // mapAnimation.setValue(1);
          break;
        case 'foodType':
          // 从中文标签转换回ID
          if (originalAnswerBeforeEdit.value !== '未选择') {
            const labels = originalAnswerBeforeEdit.value.split(', ');
            const ids = labels.map(label => {
              const option = FOOD_TYPE_OPTIONS.find(opt => opt.label === label);
              return option ? option.id : label;
            });
            setSelectedFoodType(ids);
          }
          // 不要在"未选择"时清空selectedFoodType，保持用户已有的选择
          break;
        case 'allergy':
          setAllergies(originalAnswerBeforeEdit.value);
          // 从中文标签转换回ID
          if (originalAnswerBeforeEdit.value !== '无忌口') {
            const labels = originalAnswerBeforeEdit.value.split(', ');
            const ids = labels.map(label => {
              const option = ALLERGY_OPTIONS.find(opt => opt.label === label);
              return option ? option.id : label;
            });
            setSelectedAllergies(ids);
          } else {
            setSelectedAllergies([]);
          }
          break;
        case 'preference':
          setPreferences(originalAnswerBeforeEdit.value);
          // 从中文标签转换回ID
          if (originalAnswerBeforeEdit.value !== '无特殊偏好') {
            const labels = originalAnswerBeforeEdit.value.split(', ');
            const ids = labels.map(label => {
              const option = PREFERENCE_OPTIONS.find(opt => opt.label === label);
              return option ? option.id : label;
            });
            setSelectedPreferences(ids);
          } else {
            setSelectedPreferences([]);
          }
          break;
        case 'budget':
          setBudget(originalAnswerBeforeEdit.value);
          break;
      }
      
      // 退出编辑模式
      setEditingStep(null);
      setOriginalAnswerBeforeEdit(null);
    }
  };

  // Render current step input
  const renderCurrentInput = () => {
    // 编辑模式下使用编辑步骤的数据，否则使用当前步骤
    const stepData = editingStep !== null ? STEP_CONTENT[editingStep] : getCurrentStepData();
    
    if (stepData.showAddressInput) {
      return (
        <View>
          <AddressAutocomplete
            value={address}
            onChangeText={handleAddressChange}
            onSelectAddress={handleSelectAddress}
            placeholder="请输入地址"
            iconName="location-on"
            editable={!isAddressConfirmed || editingStep === 0}
            isDisabled={isAddressConfirmed && editingStep !== 0}
            animationValue={inputSectionAnimation}
            errorMessage={inputError}
          />
          
          {/* Map Container - 编辑地址时显示 - 已注释 */}
          {/* {showMap && editingStep === 0 && (
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
              <View style={{ backgroundColor: '#ffffff', borderRadius: 8, overflow: 'hidden', marginTop: 16 }}>
                <MapComponent showMap={showMap} mapAnimation={mapAnimation} />
              </View>
            </Animated.View>
          )} */}
        </View>
      );
    }
    
    // 手机号输入已移动到AuthComponent
    
    if (stepData.showFoodTypeInput) {
      // 免单模式下只显示奶茶选项
      const optionsToShow = isFreeOrder 
        ? FOOD_TYPE_OPTIONS.filter(option => option.id === 'drink')
        : FOOD_TYPE_OPTIONS;
      
      return (
        <ImageCheckbox
          options={optionsToShow}
          selectedIds={selectedFoodType}
          onSelectionChange={setSelectedFoodType}
          animationValue={inputSectionAnimation}
          singleSelect={true}
          disabled={isFreeOrder} // 免单模式下禁用选择
        />
      );
    }
    
    if (stepData.showBudgetInput) {
      // 根据食物类型选择预算选项
      const isSelectedDrink = selectedFoodType.includes('drink');
      const budgetOptions = isSelectedDrink ? BUDGET_OPTIONS_DRINK : BUDGET_OPTIONS_FOOD;
      
      return (
        <View>
          <BudgetInput
            value={budget}
            onChangeText={setBudget}
            animationValue={inputSectionAnimation}
            onSubmitEditing={editingStep === 4 ? handleFinishEditing : undefined}
            errorMessage={inputError}
            budgetOptions={budgetOptions}
          />
          {/* 在预算选择后显示支付组件 */}
          {budget && (
            <PaymentComponent
              budget={budget}
              animationValue={inputSectionAnimation}
              onConfirmOrder={handleConfirmOrder}
              isTyping={isTyping}
              isFreeOrder={isFreeOrder}
            />
          )}
        </View>
      );
    }
    
    if (stepData.showAllergyInput) {
      return (
        <ImageCheckbox
          options={ALLERGY_OPTIONS}
          selectedIds={selectedAllergies}
          onSelectionChange={setSelectedAllergies}
          animationValue={inputSectionAnimation}
          onOtherTextChange={setOtherAllergyText}
        />
      );
    }
    
    if (stepData.showPreferenceInput) {
      return (
        <ImageCheckbox
          options={PREFERENCE_OPTIONS}
          selectedIds={selectedPreferences}
          onSelectionChange={setSelectedPreferences}
          animationValue={inputSectionAnimation}
          singleSelect={true}
          onOtherTextChange={setOtherPreferenceText}
        />
      );
    }
    
    return null;
  };

  const renderActionButton = () => {
    // 编辑模式下的按钮
    if (editingStep !== null) {
      return (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <ActionButton
            onPress={handleFinishEditing}
            title="保存"
            disabled={!canProceed()}
            isActive={canProceed()}
            animationValue={inputSectionAnimation}
          />
          <ActionButton
            onPress={handleCancelEditing}
            title="取消"
            disabled={false}
            isActive={false}
            animationValue={inputSectionAnimation}
          />
        </View>
      );
    }
    
    // 正常流程的按钮 - 地址输入直接使用确认按钮（步骤0）
    if (currentStep === 0) {
      return (
        <ActionButton
          onPress={handleAddressConfirm}
          title="确认"
          disabled={!address.trim() || address.trim().length < 5}
          isActive={!!address.trim() && address.trim().length >= 5}
          animationValue={inputSectionAnimation}
        />
      );
    }
    
    // 预算步骤特殊处理 - 选择了预算后不显示确认按钮，由PaymentComponent处理
    if (currentStep === 4 && budget) {
      return null; // 不显示确认按钮，让PaymentComponent处理下单逻辑
    }
    
    if (canProceed()) {
      return (
        <ActionButton
          onPress={handleNext}
          title={currentStep === STEP_CONTENT.length - 1 ? '确认' : '确认'}
          variant="next"
          animationValue={inputSectionAnimation}
        />
      );
    }
    
    return null;
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
                      onEdit={() => handleEditAnswer(index)}
                      formatAnswerDisplay={formatAnswerDisplay}
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