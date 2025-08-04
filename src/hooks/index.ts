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
  const lastTextRef = useRef<string>('');

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, TIMING.CURSOR_BLINK);
    
    return () => clearInterval(cursorInterval);
  }, []);

  const typeText = (text: string, speed: number = TIMING.TYPING_SPEED) => {
    // 如果文本相同，不重复触发
    if (lastTextRef.current === text && displayedText === text) {
      return;
    }
    
    // 记录当前文本
    lastTextRef.current = text;
    
    // 清除之前的定时器
    if (currentTimer) {
      clearInterval(currentTimer);
      setCurrentTimer(null);
    }
    
    setIsTyping(true);
    setDisplayedText(''); // 立即清空开始打字
    
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

  // 直接设置文本（不使用打字机效果）
  const setTextDirectly = (text: string) => {
    if (currentTimer) {
      clearInterval(currentTimer);
      setCurrentTimer(null);
    }
    setIsTyping(false);
    setDisplayedText(text);
    lastTextRef.current = text;
  };

  // 清空文本
  const clearText = () => {
    if (currentTimer) {
      clearInterval(currentTimer);
      setCurrentTimer(null);
    }
    setIsTyping(false);
    setDisplayedText('');
    lastTextRef.current = '';
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
    setTextDirectly,
    clearText,
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
  
  // 新增：推上去动画值
  const [completedQuestionsContainerAnimation] = useState(new Animated.Value(0));
  const [newQuestionSlideInAnimation] = useState(new Animated.Value(0)); // 从0开始，表示在下方

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: TIMING.SHAKE_DURATION, useNativeDriver: false }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: TIMING.SHAKE_DURATION, useNativeDriver: false }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: TIMING.SHAKE_DURATION, useNativeDriver: false }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: TIMING.SHAKE_DURATION, useNativeDriver: false }),
    ]).start();
  };

  const changeEmotion = (newEmotion: string, callback?: () => void) => {
    Animated.sequence([
      Animated.timing(emotionAnimation, {
        toValue: 0.5,
        duration: TIMING.EMOTION_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(emotionAnimation, {
        toValue: 1,
        duration: TIMING.EMOTION_DURATION,
        useNativeDriver: false,
      }),
    ]).start(() => {
      callback?.();
    });
  };

  // 流动动画：当前问题向上流入已完成区域，新问题在原位置出现
  const triggerPushUpAnimation = (callback?: () => void) => {
    // 当前问题向上滑入已完成区域并消失
    Animated.spring(newQuestionSlideInAnimation, {
      toValue: 1, // 完全滑入并消失
      tension: 60,
      friction: 8,
      useNativeDriver: false,
    }).start(() => {
      // 动画完成后重置状态，准备新问题
      setTimeout(() => {
        newQuestionSlideInAnimation.setValue(0); // 重置动画值
        callback?.();
      }, 150);
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
    completedQuestionsContainerAnimation,
    newQuestionSlideInAnimation,
    triggerShake,
    changeEmotion,
    triggerPushUpAnimation,
  };
};

// Export new hooks
export { useAppState } from './useAppState';
export { useFormSteps } from './useFormSteps';
export { useOrderManagement } from './useOrderManagement';