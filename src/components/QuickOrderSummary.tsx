import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { ActionButton } from './ActionButton';
import { rightContentStyles } from '../styles/globalStyles';

interface QuickOrderSummaryProps {
  address: string;
  selectedFoodType: string[];
  selectedAllergies: string[];
  selectedPreferences: string[];
  budget: string;
  otherAllergyText: string;
  otherPreferenceText: string;
  onConfirmOrder: () => void;
  onEditPreferences: () => void;
  animationValue: Animated.Value;
  isOrderSubmitting: boolean;
}

export const QuickOrderSummary: React.FC<QuickOrderSummaryProps> = ({
  address,
  selectedFoodType,
  selectedAllergies,
  selectedPreferences,
  budget,
  otherAllergyText,
  otherPreferenceText,
  onConfirmOrder,
  onEditPreferences,
  animationValue,
  isOrderSubmitting
}) => {
  const formatList = (items: string[], otherText?: string) => {
    const allItems = [...items];
    if (otherText && otherText.trim()) {
      allItems.push(otherText.trim());
    }
    
    if (allItems.length === 0) return '无';
    if (allItems.length === 1) return allItems[0];
    return allItems.join('、');
  };

  return (
    <Animated.View style={[
      rightContentStyles.container,
      {
        opacity: animationValue,
        transform: [
          {
            translateY: animationValue.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
        ],
      },
    ]}>
      <View style={styles.summaryContainer}>
        <Text style={styles.title}>快速下单确认</Text>
        <Text style={styles.subtitle}>使用您的保存偏好</Text>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>配送地址：</Text>
            <Text style={styles.detailValue} numberOfLines={2}>{address}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>口味偏好：</Text>
            <Text style={styles.detailValue}>{formatList(selectedFoodType)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>过敏信息：</Text>
            <Text style={styles.detailValue}>{formatList(selectedAllergies, otherAllergyText)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>餐饮偏好：</Text>
            <Text style={styles.detailValue}>{formatList(selectedPreferences, otherPreferenceText)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>预算范围：</Text>
            <Text style={styles.detailValue}>{budget}</Text>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={onEditPreferences}
            disabled={isOrderSubmitting}
          >
            <Text style={styles.editButtonText}>修改偏好</Text>
          </TouchableOpacity>
          
          <ActionButton
            title={isOrderSubmitting ? "处理中..." : "确认下单"}
            onPress={onConfirmOrder}
            disabled={isOrderSubmitting}
            style={styles.confirmButton}
          />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = {
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  } as const,
  
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  } as const,
  
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  } as const,
  
  detailsContainer: {
    marginBottom: 24,
  } as const,
  
  detailItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  } as const,
  
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    width: 80,
    flexShrink: 0,
  } as const,
  
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  } as const,
  
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  } as const,
  
  editButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  } as const,
  
  editButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  } as const,
  
  confirmButton: {
    flex: 1,
  } as const,
};