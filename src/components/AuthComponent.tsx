import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { BaseInput } from './BaseInput';
import { ActionButton } from './ActionButton';
import { sendVerificationCode, verifyCodeAndLogin, verifyInviteCodeAndCreateUser } from '../services/api';
import { DEV_CONFIG } from '../constants';

export interface AuthResult {
  success: boolean;
  isNewUser: boolean;
  userId?: string;
  phoneNumber: string;
  message?: string;
}

export interface AuthComponentProps {
  onAuthSuccess: (result: AuthResult) => void;
  onError: (error: string) => void;
  onQuestionChange: (question: string) => void; // 新增：更新问题文本的回调
  animationValue: any;
  validatePhoneNumber: (phone: string) => boolean;
  triggerShake: () => void;
  changeEmotion: (emoji: string) => void;
  resetTrigger?: number; // 新增：重置触发器，当这个值改变时重置组件状态
}

export const AuthComponent: React.FC<AuthComponentProps> = ({
  onAuthSuccess,
  onError,
  onQuestionChange,
  animationValue,
  validatePhoneNumber,
  triggerShake,
  changeEmotion,
  resetTrigger,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isVerificationCodeSent, setIsVerificationCodeSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [inputError, setInputError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationUI, setShowVerificationUI] = useState(false); // 控制验证码UI显示时机

  // 初始化时设置问题文本
  useEffect(() => {
    onQuestionChange('请输入手机号获取验证码');
  }, []);

  // 重置功能：当resetTrigger改变时重置所有状态
  useEffect(() => {
    if (resetTrigger !== undefined) {
      setPhoneNumber('');
      setVerificationCode('');
      setInviteCode('');
      setIsVerificationCodeSent(false);
      setIsPhoneVerified(false);
      setIsNewUser(false);
      setCountdown(0);
      setInputError('');
      setIsLoading(false);
      setShowVerificationUI(false);
      onQuestionChange('请输入手机号获取验证码');
    }
  }, [resetTrigger]);

  // 倒计时 useEffect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendVerificationCode = async () => {
    if (!validatePhoneNumber(phoneNumber) || phoneNumber.length !== 11) {
      triggerShake();
      setInputError('请输入正确的11位手机号');
      return;
    }
    
    // 防止重复点击
    if (isLoading) {
      return;
    }
    
    setIsLoading(true);
    setInputError('');
    onError(''); // 清除父组件错误
    
    try {
      const result = await sendVerificationCode(phoneNumber);
      
      if (result.success) {
        setIsVerificationCodeSent(true);
        setCountdown(180); // 3分钟倒计时
        changeEmotion('📱');
        
        // 根据是否为开发模式设置不同的问题文本
        const isDevMode = result.dev_code || result.message?.includes('开发模式');
        if (isDevMode) {
          onQuestionChange(`请输入验证码（开发模式请输入：${DEV_CONFIG.DEV_VERIFICATION_CODE}）`);
        } else {
          onQuestionChange('请输入收到的6位验证码');
        }
        
        // 等待问题文字完全显示后再显示验证码输入框和按钮
        setTimeout(() => {
          setShowVerificationUI(true);
        }, 1000); // 等待1秒让打字机效果完成
      } else {
        setInputError(result.message);
        triggerShake();
      }
    } catch (error) {
      const errorMessage = '发送验证码失败，请重试';
      setInputError(errorMessage);
      triggerShake();
      console.error('发送验证码错误:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setInputError('验证码格式错误，请输入6位验证码');
      triggerShake();
      return;
    }
    
    try {
      const result = await verifyCodeAndLogin(phoneNumber, verificationCode);
      
      if (result.success) {
        setIsPhoneVerified(true);
        setInputError('');
        onError(''); // 清除父组件错误
        changeEmotion('✅');
        
        // 判断是否为新用户（这里需要后端API返回新的字段）
        const isUserNew = result.is_new_user || false;
        setIsNewUser(isUserNew);
        
        if (isUserNew) {
          // 新用户需要输入邀请码
          changeEmotion('🔑');
          onQuestionChange('欢迎新用户！请输入邀请码完成注册'); // 更新问题文本
        } else {
          // 老用户直接成功
          onAuthSuccess({
            success: true,
            isNewUser: false,
            userId: result.user_id,
            phoneNumber: result.phone_number || phoneNumber,
          });
        }
      } else {
        setInputError(result.message);
        triggerShake();
      }
    } catch (error) {
      const errorMessage = '验证失败，请重试';
      setInputError(errorMessage);
      triggerShake();
      console.error('验证码验证错误:', error);
    }
  };

  const handleVerifyInviteCode = async () => {
    if (inviteCode.length < 4) {
      setInputError('请输入有效的邀请码');
      triggerShake();
      return;
    }

    try {
      const result = await verifyInviteCodeAndCreateUser(phoneNumber, inviteCode);
      
      if (result.success) {
        changeEmotion('🎉');
        setInputError('');
        onError(''); // 清除父组件错误
        
        onAuthSuccess({
          success: true,
          isNewUser: true,
          userId: result.user_id,
          phoneNumber: result.phone_number || phoneNumber,
        });
      } else {
        setInputError(result.message);
        triggerShake();
      }
    } catch (error) {
      const errorMessage = '验证邀请码失败，请重试';
      setInputError(errorMessage);
      triggerShake();
      console.error('邀请码验证错误:', error);
    }
  };

  const renderPhoneInput = () => (
    <BaseInput
      value={phoneNumber}
      onChangeText={setPhoneNumber}
      placeholder="请输入11位手机号"
      iconName="phone"
      keyboardType="numeric"
      maxLength={11}
      isError={!validatePhoneNumber(phoneNumber) && phoneNumber.length > 0}
      onClear={() => setPhoneNumber('')}
      animationValue={animationValue}
      errorMessage={inputError}
    />
  );

  const renderVerificationCodeInput = () => (
    <View style={{ marginTop: 16 }}>
      <BaseInput
        value={verificationCode}
        onChangeText={setVerificationCode}
        placeholder="请输入6位验证码"
        iconName="security"
        keyboardType="numeric"
        maxLength={6}
        isError={inputError.includes('验证码') && inputError.length > 0}
        onClear={() => setVerificationCode('')}
        onSubmitEditing={handleVerifyCode}
        animationValue={animationValue}
        errorMessage={inputError}
      />
    </View>
  );

  const renderInviteCodeInput = () => (
    <View style={{ marginTop: 16 }}>
      <BaseInput
        value={inviteCode}
        onChangeText={setInviteCode}
        placeholder="请输入邀请码"
        iconName="card-membership"
        isError={inputError.includes('邀请码') && inputError.length > 0}
        onClear={() => setInviteCode('')}
        onSubmitEditing={handleVerifyInviteCode}
        animationValue={animationValue}
        errorMessage={inputError}
      />
    </View>
  );

  const renderActionButtons = () => {
    // 新用户邀请码验证阶段
    if (isPhoneVerified && isNewUser) {
      return (
        <ActionButton
          onPress={handleVerifyInviteCode}
          title="验证邀请码"
          disabled={inviteCode.length < 4}
          isActive={inviteCode.length >= 4}
          animationValue={animationValue}
        />
      );
    }
    
    // 手机号步骤的按钮逻辑
    if (!isVerificationCodeSent) {
      return (
        <ActionButton
          onPress={handleSendVerificationCode}
          title={isLoading ? "发送中..." : "发送验证码"}
          disabled={!validatePhoneNumber(phoneNumber) || phoneNumber.length !== 11 || isLoading}
          isActive={validatePhoneNumber(phoneNumber) && phoneNumber.length === 11 && !isLoading}
          animationValue={animationValue}
        />
      );
    } else if (!isPhoneVerified) {
      return (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <ActionButton
            onPress={handleVerifyCode}
            title="确认"
            disabled={verificationCode.length !== 6}
            isActive={verificationCode.length === 6}
            animationValue={animationValue}
          />
          <ActionButton
            onPress={handleSendVerificationCode}
            title={isLoading ? "发送中..." : (countdown > 0 ? `重新发送(${countdown}s)` : "重新发送")}
            disabled={countdown > 0 || isLoading}
            isActive={countdown === 0 && !isLoading}
            animationValue={animationValue}
          />
        </View>
      );
    }
    
    return null;
  };

  return (
    <View>
      {renderPhoneInput()}
      
      {isVerificationCodeSent && !isPhoneVerified && showVerificationUI && renderVerificationCodeInput()}
      
      {isPhoneVerified && isNewUser && renderInviteCodeInput()}
      
      <View style={{ marginTop: 16 }}>
        {(!isVerificationCodeSent || showVerificationUI) && renderActionButtons()}
      </View>
    </View>
  );
};