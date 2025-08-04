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
        <View style={questionStyles.questionHeader}>
          {/* 已完成问题不显示头像，使用占位空间保持对齐 */}
          <View style={{ width: avatarStyles.avatarSimple.width, height: avatarStyles.avatarSimple.height }} />
          <Text style={questionStyles.questionText}>
            {question}
          </Text>
        </View>
        
        {isEditing ? (
          <View style={{ marginLeft: 27, marginTop: 16 }}>
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
                    // 移动端：始终显示的编辑按钮
                    <TouchableOpacity 
                      onPress={onEdit}
                      style={[
                        answerStyles.editAnswerButton,
                        {
                          opacity: 1,
                          backgroundColor: theme.GRAY_100,
                          borderRadius: 6,
                          marginLeft: 8,
                          padding: 8,
                        }
                      ]}
                      hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                    >
                      <SimpleIcon 
                        name="edit" 
                        size={16} 
                        color={theme.GRAY_600} 
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
    </Animated.View>
  );
};