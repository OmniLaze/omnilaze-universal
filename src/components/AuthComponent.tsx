import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { BaseInput } from './BaseInput';
import { ActionButton } from './ActionButton';
import { VerificationCodeInput } from './VerificationCodeInput';
import { sendVerificationCode, verifyCodeAndLogin, verifyInviteCodeAndCreateUser } from '../services/api';
import { DEV_CONFIG } from '../constants';

export interface AuthResult {
  success: boolean;
  isNewUser: boolean;
  userId?: string;
  phoneNumber: string;
  message?: string;
  isPhoneVerificationStep?: boolean; // 标识这只是手机号验证步骤
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
  const [isVerificationSuccess, setIsVerificationSuccess] = useState(false); // 验证成功状态

  // 初始化时设置问题文本
  useEffect(() => {
    onQuestionChange('请输入手机号获取验证码');
  }, []);

  // 验证码阶段问题文本更新
  useEffect(() => {
    if (isVerificationCodeSent && !isPhoneVerified) {
      onQuestionChange('请输入收到的6位验证码');
    }
  }, [isVerificationCodeSent, isPhoneVerified]);

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
      setIsVerificationSuccess(false); // 重置验证成功状态
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
        
        // 触发手机号作为答案的动画 - 通过调用父组件的成功回调
        // 这里我们传递一个特殊标识，表示这只是第一步完成
        onAuthSuccess({
          success: true,
          isNewUser: false, // 临时值，真实值在验证码验证后确定
          userId: 'temp', // 临时值
          phoneNumber: phoneNumber,
          isPhoneVerificationStep: true, // 特殊标识
        });
      } else {
        setInputError(result.message);
        triggerShake();
      }
    } catch (error) {
      const errorMessage = '发送验证码失败，请重试';
      setInputError(errorMessage);
      triggerShake();
      // 发送验证码失败时静默处理
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationCodeComplete = async (code: string) => {
    setVerificationCode(code);
    
    try {
      const result = await verifyCodeAndLogin(phoneNumber, code);
      
      if (result.success) {
        setIsVerificationSuccess(true); // 设置验证成功状态
        setIsPhoneVerified(true);
        setInputError('');
        onError(''); // 清除父组件错误
        changeEmotion('✅');
        
        // 显示成功动画一段时间后再继续
        setTimeout(() => {
          // 判断是否为新用户
          const isUserNew = result.is_new_user || false;
          setIsNewUser(isUserNew);
          
          if (isUserNew) {
            // 新用户需要输入邀请码
            changeEmotion('🔑');
            onQuestionChange('欢迎新用户！请输入邀请码完成注册');
          } else {
            // 老用户直接成功 - 触发答案动画
            onAuthSuccess({
              success: true,
              isNewUser: false,
              userId: result.user_id,
              phoneNumber: result.phone_number || phoneNumber,
              userSequence: result.user_sequence, // 传递用户注册次序
            });
          }
        }, 1000); // 显示成功状态1秒
      } else {
        setInputError(result.message);
        triggerShake();
      }
    } catch (error) {
      const errorMessage = '验证失败，请重试';
      setInputError(errorMessage);
      triggerShake();
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
      // 邀请码验证失败时静默处理
    }
  };

  const renderPhoneInput = () => (
    <BaseInput
      value={phoneNumber}
      onChangeText={isVerificationCodeSent ? undefined : setPhoneNumber} // 验证码阶段不允许修改
      placeholder="请输入11位手机号"
      iconName="phone"
      keyboardType="numeric"
      maxLength={11}
      isError={!validatePhoneNumber(phoneNumber) && phoneNumber.length > 0}
      onClear={isVerificationCodeSent ? undefined : () => setPhoneNumber('')} // 验证码阶段不允许清除
      animationValue={animationValue}
      errorMessage={inputError}
      editable={!isVerificationCodeSent} // 验证码阶段禁止编辑
    />
  );

  const renderVerificationCodeInput = () => (
    <VerificationCodeInput
      value={verificationCode}
      onChangeText={setVerificationCode}
      onComplete={handleVerificationCodeComplete}
      errorMessage={inputError.includes('验证码') ? inputError : ''}
      animationValue={animationValue}
      visible={true} // 始终可见，因为这个组件只在需要的时候才渲染
      isVerificationSuccess={isVerificationSuccess}
    />
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
    
    // 手机号步骤的按钮
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
    }
    
    // 验证码步骤的按钮 - 重新发送
    if (isVerificationCodeSent && !isPhoneVerified) {
      return (
        <ActionButton
          onPress={handleSendVerificationCode}
          title={isLoading ? "发送中..." : (countdown > 0 ? `重新发送(${countdown}s)` : "重新发送")}
          disabled={countdown > 0 || isLoading}
          isActive={countdown === 0 && !isLoading}
          animationValue={animationValue}
        />
      );
    }
    
    return null;
  };

  return (
    <View>
      {/* 手机号输入阶段 */}
      {!isVerificationCodeSent && renderPhoneInput()}
      
      {/* 验证码输入阶段 - 显示六个方框 */}
      {isVerificationCodeSent && !isPhoneVerified && renderVerificationCodeInput()}
      
      {/* 邀请码输入阶段 */}
      {isPhoneVerified && isNewUser && renderInviteCodeInput()}
      
      <View style={{ marginTop: 16 }}>
        {renderActionButtons()}
      </View>
    </View>
  );
};