import React from 'react';
import { View, Text, Animated, Image, Platform } from 'react-native';
import { createQuestionStyles, createAvatarStyles } from '../styles/globalStyles';
import { useTheme } from '../contexts/ColorThemeContext';

interface CurrentQuestionProps {
  displayedText: string;
  isTyping: boolean;
  showCursor: boolean;
  cursorOpacity?: Animated.Value;
  streamingOpacity?: Animated.Value;
  isStreaming?: boolean;
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
  cursorOpacity,
  streamingOpacity,
  isStreaming = false,
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
        {/* 三分栏布局容器 */}
        <View style={{
          flexDirection: 'row',
          flex: 1,
          minHeight: 120,
        }}>
          {/* 左侧背景区域 */}
          <View style={{
            flexBasis: 'auto',
            flexShrink: 1,
            flexGrow: 0,
            backgroundColor: theme.BACKGROUND,
            borderTopLeftRadius: 16,
            borderBottomLeftRadius: 16,
          }} />
          
          {/* 中间内容区域 */}
          <View style={{
            flexBasis: 'auto',
            flexShrink: 0,
            flexGrow: 1,
            backgroundColor: theme.BACKGROUND,
            paddingHorizontal: 20,
            justifyContent: 'center',
            alignItems: 'flex-start',
            flexDirection: 'row',
          }}>
            {/* 头像区域 */}
            <Animated.View 
              style={[
                {
                  marginRight: 18,
                  alignSelf: 'flex-start',
                  marginTop: 0, // 与问题顶部对齐
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
                  ...(Platform.OS === 'web' 
                    ? { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' }
                    : {
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                      }
                  )
                }
              ]}>
                <Image 
                  source={require('../../assets/icon.png')} 
                  style={avatarStyles.avatarImage}
                />
              </View>
            </Animated.View>
            
            {/* 问题和输入内容区域 */}
            <View style={{ flex: 1 }}>
              <View style={[questionStyles.questionHeader, { marginBottom: 0 }]}>
                {/* 移除底部间距 */}
                <View style={{ flexDirection: 'column', width: '100%' }}>
                  {/* 问题文字容器 */}
                  <View 
                    style={[
                      questionStyles.questionTextContainer,
                      {
                        flex: 1,
                        transform: [{
                          translateX: shakeAnimation,
                        }],
                        marginLeft: 0,
                        marginBottom: 4, // 从8减少到4
                      },
                    ]}
                  >
                    <Animated.View style={{ opacity: streamingOpacity || 1 }}>
                      <Text style={questionStyles.currentQuestionText}>
                        {displayedText}
                        {isTyping && showCursor && (
                          <Animated.Text 
                            style={[
                              questionStyles.cursor,
                              { 
                                opacity: cursorOpacity || 1,
                                fontSize: isStreaming ? 16 : 18,
                                color: isStreaming ? 'rgba(255,255,255,0.8)' : questionStyles.cursor.color,
                              }
                            ]}
                          >
                            |
                          </Animated.Text>
                        )}
                      </Text>
                    </Animated.View>
                  </View>
                  
                  {/* children 直接放在问题下方，实现对齐 */}
                  {children}
                </View>
              </View>
            </View>
          </View>
          
          {/* 右侧背景区域 */}
          <View style={{
            flexBasis: 'auto',
            flexShrink: 1,
            flexGrow: 0,
            backgroundColor: theme.BACKGROUND,
            borderTopRightRadius: 16,
            borderBottomRightRadius: 16,
          }} />
        </View>

        {/* children 现在已经移动到中间块内部，这里移除 */}
      </View>
    </Animated.View>
  );
};