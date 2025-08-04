import React from 'react';
import { View, Text } from 'react-native';
import { createProgressStyles } from '../styles/globalStyles';
import { useTheme } from '../contexts/ColorThemeContext';
import { STEP_TITLES } from '../constants';

interface ProgressStepsProps {
  currentStep: number;
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({ currentStep }) => {
  const { theme } = useTheme();
  const progressStyles = createProgressStyles(theme);

  return (
    <View style={progressStyles.progressContainer}>
      <View style={progressStyles.progressSteps}>
        {STEP_TITLES.map((title, index) => (
          <View key={index} style={progressStyles.stepItem}>
            <View style={currentStep >= index ? progressStyles.activeStep : progressStyles.inactiveStep}>
              {currentStep >= index && <View style={progressStyles.activeStepInner} />}
            </View>
            <Text style={currentStep >= index ? progressStyles.activeStepText : progressStyles.inactiveStepText}>
              {title}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};