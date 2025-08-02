import { useState, useEffect } from 'react';
import { CookieManager } from '../utils/cookieManager';
import { STEP_CONTENT } from '../data/stepContent';
import { DEV_CONFIG } from '../constants';
import type { CompletedAnswers, Answer, AuthResult, AddressSuggestion } from '../types';

export const useAppState = () => {
  // 基础表单状态
  const [address, setAddress] = useState('');
  const [budget, setBudget] = useState('');
  const [allergies, setAllergies] = useState('');
  const [preferences, setPreferences] = useState('');
  
  // 复选框状态
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [selectedFoodType, setSelectedFoodType] = useState<string[]>([]);
  
  // 其他输入状态
  const [otherAllergyText, setOtherAllergyText] = useState('');
  const [otherPreferenceText, setOtherPreferenceText] = useState('');
  
  // 地址相关状态
  const [showMap, setShowMap] = useState(false);
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const [selectedAddressSuggestion, setSelectedAddressSuggestion] = useState<AddressSuggestion | null>(null);
  
  // 流程控制状态
  const [currentStep, setCurrentStep] = useState(0);
  const [completedAnswers, setCompletedAnswers] = useState<CompletedAnswers>({});
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [originalAnswerBeforeEdit, setOriginalAnswerBeforeEdit] = useState<Answer | null>(null);
  
  // 认证状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authResult, setAuthResult] = useState<AuthResult | null>(null);
  const [authQuestionText, setAuthQuestionText] = useState('请输入手机号获取验证码');
  const [isStateRestored, setIsStateRestored] = useState(false);
  
  // 订单状态
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [currentOrderNumber, setCurrentOrderNumber] = useState<string | null>(null);
  const [currentUserSequenceNumber, setCurrentUserSequenceNumber] = useState<number | null>(null);
  const [isOrderSubmitting, setIsOrderSubmitting] = useState(false);
  const [isSearchingRestaurant, setIsSearchingRestaurant] = useState(false);
  const [isOrderCompleted, setIsOrderCompleted] = useState(false);
  
  // UI状态
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isFreeOrder, setIsFreeOrder] = useState(false);
  const [showFreeDrinkModal, setShowFreeDrinkModal] = useState(false);
  const [authResetTrigger, setAuthResetTrigger] = useState(0);
  
  // 快速下单模式状态
  const [isQuickOrderMode, setIsQuickOrderMode] = useState(false);

  // 重置所有状态到初始状态的函数
  const resetAllState = () => {
    setIsAuthenticated(false);
    setAuthResult(null);
    setCurrentStep(0);
    setCompletedAnswers({});
    setEditingStep(null);
    setOriginalAnswerBeforeEdit(null);
    
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
    setIsOrderCompleted(false);
    
    setShowInviteModal(false);
    setShowFreeDrinkModal(false);
    setIsFreeOrder(false);
    setIsQuickOrderMode(false);
    setAuthQuestionText('请输入手机号获取验证码');
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

  // 组件加载时检查Cookie登录状态
  useEffect(() => {
    // 首先检查开发模式
    if (DEV_CONFIG.SKIP_AUTH) {
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
      }
      
      setIsStateRestored(true);
      return;
    }
    
    const savedSession = CookieManager.getUserSession();
    
    if (savedSession) {
      setIsAuthenticated(true);
      setAuthResult({
        userId: savedSession.userId,
        phoneNumber: savedSession.phoneNumber,
        isNewUser: savedSession.isNewUser
      });
      
      const phoneAnswer = { type: 'phone', value: savedSession.phoneNumber };
      setCompletedAnswers({ [-1]: phoneAnswer });
      
      const savedConversation = CookieManager.getConversationState();
      
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
      }
      
      setIsStateRestored(true);
    } else {
      setIsStateRestored(true);
    }
  }, []);

  // 监听状态变化，自动保存对话状态
  useEffect(() => {
    if (isAuthenticated) {
      saveConversationState();
    }
  }, [currentStep, completedAnswers, address, budget, selectedAllergies, selectedPreferences, selectedFoodType, otherAllergyText, otherPreferenceText, isAddressConfirmed, showMap]);

  return {
    // 基础表单状态
    address, setAddress,
    budget, setBudget,
    allergies, setAllergies,
    preferences, setPreferences,
    
    // 复选框状态
    selectedAllergies, setSelectedAllergies,
    selectedPreferences, setSelectedPreferences,
    selectedFoodType, setSelectedFoodType,
    
    // 其他输入状态
    otherAllergyText, setOtherAllergyText,
    otherPreferenceText, setOtherPreferenceText,
    
    // 地址相关状态
    showMap, setShowMap,
    isAddressConfirmed, setIsAddressConfirmed,
    selectedAddressSuggestion, setSelectedAddressSuggestion,
    
    // 流程控制状态
    currentStep, setCurrentStep,
    completedAnswers, setCompletedAnswers,
    editingStep, setEditingStep,
    originalAnswerBeforeEdit, setOriginalAnswerBeforeEdit,
    
    // 认证状态
    isAuthenticated, setIsAuthenticated,
    authResult, setAuthResult,
    authQuestionText, setAuthQuestionText,
    isStateRestored, setIsStateRestored,
    
    // 订单状态
    currentOrderId, setCurrentOrderId,
    currentOrderNumber, setCurrentOrderNumber,
    currentUserSequenceNumber, setCurrentUserSequenceNumber,
    isOrderSubmitting, setIsOrderSubmitting,
    isSearchingRestaurant, setIsSearchingRestaurant,
    isOrderCompleted, setIsOrderCompleted,
    
    // UI状态
    showInviteModal, setShowInviteModal,
    isFreeOrder, setIsFreeOrder,
    showFreeDrinkModal, setShowFreeDrinkModal,
    authResetTrigger, setAuthResetTrigger,
    
    // 快速下单模式状态
    isQuickOrderMode, setIsQuickOrderMode,
    
    // 工具函数
    resetAllState,
    saveConversationState
  };
};