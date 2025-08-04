import React from 'react';
import { View, Text, Animated, Image } from 'react-native';
import { createQuestionStyles, createAvatarStyles } from '../styles/globalStyles';
import { useTheme } from '../contexts/ColorThemeContext';

interface CurrentQuestionProps {
  displayedText: string;
  isTyping: boolean;
  showCursor: boolean;
  inputError: string;
  currentStep: number;
  currentQuestionAnimation: Animated.Value;
  shakeAnimation: Animated.Value;
  emotionAnimation?: Animated.Value;
  children?: React.ReactNode;
}

export const CurrentQuestion: React.FC<CurrentQuestionProps> = ({
  displayedText,
  isTyping,
  showCursor,
  inputError,
  currentStep,
  currentQuestionAnimation,
  shakeAnimation,
  emotionAnimation,
  children,
}) => {
  const { theme } = useTheme();
  
  // 创建动态样式
  const questionStyles = createQuestionStyles(theme);
  const avatarStyles = createAvatarStyles(theme);
  
  return (
    <Animated.View
      style={[
        {
          opacity: currentQuestionAnimation,
          transform: [{
            translateY: currentQuestionAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            }),
          }],
        },
      ]}
    >
      <View style={questionStyles.currentQuestionCard}>
        <View style={questionStyles.questionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            {/* 头像 - 固定在问题左边50px */}
            <Animated.View 
              style={[
                {
                  marginRight: 18, // 头像宽度32px + 18px间距 = 50px总间距
                  transform: [
                    {
                      scale: emotionAnimation || new Animated.Value(1),
                    },
                  ],
                },
              ]}
            >
              <View style={[
                avatarStyles.avatarSimple,
                {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }
              ]}>
                <Image 
                  source={require('../../assets/icon.png')} 
                  style={avatarStyles.avatarImage}
                />
              </View>
            </Animated.View>
            
            {/* 问题文字容器 */}
            <View 
              style={[
                questionStyles.questionTextContainer,
                {
                  flex: 1, // 占据剩余空间
                  transform: [{
                    translateX: shakeAnimation,
                  }],
                  marginLeft: 0, // 移除原有的marginLeft，因为现在使用flexbox布局
                },
              ]}
            >
              <Text style={questionStyles.currentQuestionText}>
                {displayedText}
                {isTyping && showCursor && <Text style={questionStyles.cursor}>|</Text>}
              </Text>
            </View>
          </View>
        </View>

        {children}
      </View>
    </Animated.View>
  );
};