import React, { useState } from 'react';
import { View, Text, Image, Animated, TouchableOpacity, Pressable, Dimensions } from 'react-native';
import { SimpleIcon } from './SimpleIcon';
import { createQuestionStyles, createAvatarStyles, createAnswerStyles } from '../styles/globalStyles';
import { useTheme } from '../contexts/ColorThemeContext';
import type { Answer } from '../types';

const { width } = Dimensions.get('window');

interface CompletedQuestionProps {
  question: string;
  answer: Answer;
  index: number;
  questionAnimation: Animated.Value;
  answerAnimation: Animated.Value;
  onEdit: () => void;
  formatAnswerDisplay: (answer: Answer) => string;
  isEditing?: boolean;
  editingInput?: React.ReactNode;
  editingButtons?: React.ReactNode;
  canEdit?: boolean; // 新增：是否可以编辑
}

export const CompletedQuestion: React.FC<CompletedQuestionProps> = ({
  question,
  answer,
  index,
  questionAnimation,
  answerAnimation,
  onEdit,
  formatAnswerDisplay,
  isEditing = false,
  editingInput,
  editingButtons,
  canEdit = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = width <= 768;
  const { theme } = useTheme();
  
  // 创建动态样式
  const questionStyles = createQuestionStyles(theme);
  const avatarStyles = createAvatarStyles(theme);
  const answerStyles = createAnswerStyles(theme);

  return (
    <Animated.View 
      key={index} 
      style={[
        questionStyles.completedQuestionContainer,
        {
          opacity: questionAnimation,
          transform: [{
            translateY: questionAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        },
      ]}
    >
      <View style={questionStyles.completedQuestionRow}>
        {/* 三分栏布局容器 */}
        <View style={{
          flexDirection: 'row',
          flex: 1,
          minHeight: 80,
        }}>
          {/* 左侧背景区域 */}
          <View style={{
            flexBasis: 'auto',
            flexShrink: 1,
            flexGrow: 0,
            backgroundColor: theme.BACKGROUND,
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
          }} />
          
          {/* 中间内容区域 */}
          <View style={{
            flexBasis: 'auto',
            flexShrink: 0,
            flexGrow: 1,
            backgroundColor: theme.BACKGROUND,
            paddingHorizontal: 20,
            paddingVertical: 12,
            justifyContent: 'center',
            alignItems: 'flex-start',
            flexDirection: 'row',
          }}>
            {/* 头像占位区域 */}
            <View style={{
              width: 32, // LAYOUT.AVATAR_SIZE
              marginRight: 18, // 与CurrentQuestion中的头像右边距一致
              alignSelf: 'flex-start',
              marginTop: 0,
            }} />
            
            {/* 问题内容区域 */}
            <View style={{ flex: 1 }}>
              <View style={questionStyles.questionHeader}>
                <Text style={questionStyles.questionText}>
                  {question}
                </Text>
              </View>
              
              {isEditing ? (
                <View style={{ marginLeft: 0, marginTop: 8 }}>
                  {editingInput}
                  {editingButtons}
                </View>
              ) : (
                <Pressable 
                  style={answerStyles.completedAnswerText}
                  onHoverIn={() => !isMobile && setIsHovered(true)}
                  onHoverOut={() => !isMobile && setIsHovered(false)}
                >
                  <Animated.View
                    style={{
                      opacity: answerAnimation,
                      transform: [{
                        translateY: answerAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0], // 从下往上滑入
                        }),
                      }],
                    }}
                  >
                    <View style={answerStyles.answerWithEdit}>
                      <Text style={answerStyles.answerValue}>
                        {formatAnswerDisplay(answer)}
                      </Text>
                      {canEdit && (
                        isMobile ? (
                          // 移动端：极简图标（无外框），更贴近系统原生视觉
                          <TouchableOpacity
                            onPress={onEdit}
                            style={[
                              answerStyles.editAnswerButton,
                              { padding: 0, marginLeft: 6, backgroundColor: 'transparent' }
                            ]}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            activeOpacity={0.6}
                          >
                            <SimpleIcon
                              name="edit"
                              size={18}
                              color={theme.TEXT_SECONDARY}
                            />
                          </TouchableOpacity>
                        ) : (
                          // 桌面端：悬停显示
                          isHovered && (
                            <TouchableOpacity 
                              onPress={onEdit}
                              style={answerStyles.editAnswerButton}
                            >
                              <SimpleIcon name="edit" size={22} color={theme.GRAY_600} />
                            </TouchableOpacity>
                          )
                        )
                      )}
                    </View>
                  </Animated.View>
                </Pressable>
              )}
            </View>
          </View>
          
          {/* 右侧背景区域 */}
          <View style={{
            flexBasis: 'auto',
            flexShrink: 1,
            flexGrow: 0,
            backgroundColor: theme.BACKGROUND,
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
          }} />
        </View>
      </View>
    </Animated.View>
  );
};