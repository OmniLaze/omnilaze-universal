import { useState } from 'react';
import { createOrder, submitOrder } from '../services/api';
import { TIMING } from '../constants';
import type { AuthResult } from '../types';

interface UseOrderManagementProps {
  authResult: AuthResult | null;
  address: string;
  selectedAllergies: string[];
  selectedPreferences: string[];
  budget: string;
  selectedFoodType: string[];
  isFreeOrder: boolean;
  currentUserSequenceNumber: number | null;
  
  // State setters
  setCurrentOrderId: (value: string | null) => void;
  setCurrentOrderNumber: (value: string | null) => void;
  setCurrentUserSequenceNumber: (value: number | null) => void;
  setIsOrderSubmitting: (value: boolean) => void;
  setIsSearchingRestaurant: (value: boolean) => void;
  setIsOrderCompleted: (value: boolean) => void;
  setCurrentStep: (value: number) => void;
  setCompletedAnswers: (value: any) => void;
  setInputError: (value: string) => void;
  
  // Animation & UI functions
  triggerShake: () => void;
  changeEmotion: (emotion: string) => void;
  typeText: (text: string, speed: number) => void;
}

export const useOrderManagement = (props: UseOrderManagementProps) => {
  const {
    authResult, address, selectedAllergies, selectedPreferences, budget,
    selectedFoodType, isFreeOrder, currentUserSequenceNumber,
    setCurrentOrderId, setCurrentOrderNumber, setCurrentUserSequenceNumber,
    setIsOrderSubmitting, setIsSearchingRestaurant, setIsOrderCompleted,
    setCurrentStep, setCompletedAnswers, setInputError,
    triggerShake, changeEmotion, typeText
  } = props;

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
      foodType: selectedFoodType,
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
    }
  };

  // 确认下单后开始搜索餐厅
  const handleConfirmOrder = async () => {
    setIsSearchingRestaurant(true);
    changeEmotion('🔍');
    
    // 立即标记支付步骤为完成，隐藏PaymentComponent
    setCompletedAnswers((prev: any) => ({
      ...prev,
      [4]: { type: 'payment', value: '已确认支付' } // 假设支付是第4步
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
        setIsOrderCompleted(true);
        changeEmotion('🎉');
        typeText('我去下单，记得保持手机畅通，不要错过外卖员电话哦', TIMING.TYPING_SPEED_FAST);
      }, 5000);
    } catch (error) {
      setIsSearchingRestaurant(false);
      changeEmotion('😰');
      setInputError('订单创建失败，请重试');
    }
  };

  return {
    handleCreateOrder,
    handleSubmitOrder,
    handleConfirmOrder
  };
};