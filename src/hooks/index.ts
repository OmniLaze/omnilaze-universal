import { useState, useRef, useEffect } from 'react';
import { Animated, Dimensions } from 'react-native';
import { TIMING, VALIDATION } from '../constants';
import type { Answer, ValidationResult } from '../types';

const { height } = Dimensions.get('window');

export const useTypewriterEffect = () => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [currentTimer, setCurrentTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, TIMING.CURSOR_BLINK);
    
    return () => clearInterval(cursorInterval);
  }, []);

  const typeText = (text: string, speed: number = TIMING.TYPING_SPEED) => {
    // 清除之前的定时器
    if (currentTimer) {
      clearInterval(currentTimer);
      setCurrentTimer(null);
    }
    
    setIsTyping(true);
    setDisplayedText(''); // 清空当前文本
    
    if (!text || text.length === 0) {
      setIsTyping(false);
      return;
    }
    
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
        setCurrentTimer(null);
      }
    }, speed);
    
    setCurrentTimer(timer);
    return timer;
  };

  // 清理函数
  useEffect(() => {
    return () => {
      if (currentTimer) {
        clearInterval(currentTimer);
      }
    };
  }, [currentTimer]);

  return {
    displayedText,
    isTyping,
    showCursor,
    typeText,
    setDisplayedText,
  };
};

export const useValidation = () => {
  const [inputError, setInputError] = useState('');

  const validatePhoneNumber = (phone: string): boolean => {
    return VALIDATION.PHONE_REGEX.test(phone);
  };

  const validateInput = (step: number, value: any): ValidationResult => {
    setInputError('');
    
    switch (step) {
      case 0: // 地址
        if (!value || value.trim().length < VALIDATION.MIN_ADDRESS_LENGTH) {
          const errorMessage = '请输入完整的配送地址';
          setInputError(errorMessage);
          return { isValid: false, errorMessage };
        }
        return { isValid: true };
        
      case 1: // 食物类型
        if (!value || value === '未选择' || (Array.isArray(value) && value.length === 0)) {
          const errorMessage = '请选择食物类型';
          setInputError(errorMessage);
          return { isValid: false, errorMessage };
        }
        return { isValid: true };
        
      case 2: // 忌口
      case 3: // 偏好
        return { isValid: true };
        
      case 4: // 预算
        const budgetNum = parseFloat(value);
        if (!value || budgetNum <= 0) {
          const errorMessage = '请设置一个合理的预算金额';
          setInputError(errorMessage);
          return { isValid: false, errorMessage };
        }
        if (budgetNum < VALIDATION.MIN_BUDGET) {
          const errorMessage = '预算至少需要10元哦';
          setInputError(errorMessage);
          return { isValid: false, errorMessage };
        }
        return { isValid: true };
        
      default:
        return { isValid: true };
    }
  };

  return {
    inputError,
    validateInput,
    validatePhoneNumber,
    setInputError,
  };
};

export const useAnimations = () => {
  const [questionAnimations] = useState(() => 
    Array.from({ length: 5 }, () => new Animated.Value(1))
  );
  const [answerAnimations] = useState(() => 
    Array.from({ length: 5 }, () => new Animated.Value(0))
  );
  const [currentQuestionAnimation] = useState(new Animated.Value(0));
  const [mapAnimation] = useState(new Animated.Value(0));
  const [emotionAnimation] = useState(new Animated.Value(1));
  const [shakeAnimation] = useState(new Animated.Value(0));
  const [inputSectionAnimation] = useState(new Animated.Value(0));
  const [themeAnimation] = useState(new Animated.Value(0));

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: TIMING.SHAKE_DURATION, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: TIMING.SHAKE_DURATION, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: TIMING.SHAKE_DURATION, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: TIMING.SHAKE_DURATION, useNativeDriver: true }),
    ]).start();
  };

  const changeEmotion = (newEmotion: string, callback?: () => void) => {
    Animated.sequence([
      Animated.timing(emotionAnimation, {
        toValue: 0.5,
        duration: TIMING.EMOTION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(emotionAnimation, {
        toValue: 1,
        duration: TIMING.EMOTION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback?.();
    });
  };

  return {
    questionAnimations,
    answerAnimations,
    currentQuestionAnimation,
    mapAnimation,
    emotionAnimation,
    shakeAnimation,
    inputSectionAnimation,
    themeAnimation,
    triggerShake,
    changeEmotion,
  };
};