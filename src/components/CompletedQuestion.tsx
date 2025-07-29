import React, { useState } from 'react';
import { View, Text, Image, Animated, TouchableOpacity, Pressable, Dimensions } from 'react-native';
import { SimpleIcon } from './SimpleIcon';
import { questionStyles, avatarStyles, answerStyles } from '../styles/globalStyles';
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
          <View style={avatarStyles.avatarSimple}>
            <Image 
              source={require('../../assets/icon.png')} 
              style={avatarStyles.avatarImage}
            />
          </View>
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
            <View
              style={{
                opacity: 1,
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
                          backgroundColor: '#f3f4f6',
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
                        color="#4B5563" 
                      />
                    </TouchableOpacity>
                  ) : (
                    // 桌面端：悬停显示
                    isHovered && (
                      <TouchableOpacity 
                        onPress={onEdit}
                        style={answerStyles.editAnswerButton}
                      >
                        <SimpleIcon name="edit" size={22} color="#4B5563" />
                      </TouchableOpacity>
                    )
                  )
                )}
              </View>
            </View>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
};