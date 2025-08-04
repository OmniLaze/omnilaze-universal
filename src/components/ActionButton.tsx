import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { createButtonStyles } from '../styles/inputStyles';
import { useTheme } from '../contexts/ColorThemeContext';

interface ActionButtonProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  isActive?: boolean;
  animationValue?: Animated.Value;
  variant?: 'confirm' | 'next';
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  onPress,
  title,
  disabled = false,
  isActive = true,
  animationValue,
  variant = 'confirm'
}) => {
  const { theme } = useTheme();
  const buttonStyles = createButtonStyles(theme);
  
  const getButtonStyle = () => {
    if (variant === 'next') {
      return buttonStyles.nextSimpleButton;
    }
    if (disabled) {
      return [buttonStyles.simpleButton, buttonStyles.disabledSimpleButton];
    }
    if (isActive) {
      return [buttonStyles.simpleButton, buttonStyles.activeSimpleButton];
    }
    return buttonStyles.simpleButton;
  };

  const getTextStyle = () => {
    if (variant === 'next') {
      return buttonStyles.nextSimpleButtonText;
    }
    if (disabled) {
      return [buttonStyles.simpleButtonText, buttonStyles.disabledSimpleButtonText];
    }
    if (isActive) {
      return [buttonStyles.simpleButtonText, buttonStyles.activeSimpleButtonText];
    }
    return buttonStyles.simpleButtonText;
  };

  const WrapperComponent = animationValue ? Animated.View : View;
  const wrapperProps = animationValue 
    ? {
        style: {
          opacity: animationValue,
          transform: [{
            translateY: animationValue.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        },
      }
    : {};

  return (
    <WrapperComponent {...wrapperProps}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={getButtonStyle()}
      >
        <Text style={getTextStyle()}>
          {title}
        </Text>
      </TouchableOpacity>
    </WrapperComponent>
  );
};