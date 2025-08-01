import React from 'react';
import { View, Animated } from 'react-native';
import { AddressAutocomplete } from './AddressAutocomplete';
import { ImageCheckbox } from './ImageCheckbox';
import { BudgetInput } from './BudgetInput';
import { PaymentComponent } from './PaymentComponent';
import { ActionButton } from './ActionButton';
import { ALLERGY_OPTIONS, PREFERENCE_OPTIONS, FOOD_TYPE_OPTIONS } from '../data/checkboxOptions';
import { BUDGET_OPTIONS_FOOD, BUDGET_OPTIONS_DRINK } from '../constants';
import type { AddressSuggestion } from '../types';

interface FormInputContainerProps {
  // Current step data
  stepData: any;
  editingStep: number | null;
  currentStep: number;
  
  // Form state
  address: string;
  budget: string;
  selectedAllergies: string[];
  selectedPreferences: string[];
  selectedFoodType: string[];
  otherAllergyText: string;
  otherPreferenceText: string;
  isAddressConfirmed: boolean;
  isFreeOrder: boolean;
  
  // Form handlers
  handleAddressChange: (text: string) => void;
  handleSelectAddress: (suggestion: AddressSuggestion) => void;
  setBudget: (value: string) => void;
  setSelectedAllergies: (value: string[]) => void;
  setSelectedPreferences: (value: string[]) => void;
  setSelectedFoodType: (value: string[]) => void;
  setOtherAllergyText: (value: string) => void;
  setOtherPreferenceText: (value: string) => void;
  
  // Action handlers
  handleFinishEditing?: () => void;
  handleConfirmOrder: () => void;
  
  // Animation & UI
  inputSectionAnimation: Animated.Value;
  inputError: string;
  isTyping: boolean;
  
  // Button handlers
  renderActionButton: () => React.ReactNode;
}

export const FormInputContainer: React.FC<FormInputContainerProps> = ({
  stepData,
  editingStep,
  currentStep,
  address,
  budget,
  selectedAllergies,
  selectedPreferences,
  selectedFoodType,
  otherAllergyText,
  otherPreferenceText,
  isAddressConfirmed,
  isFreeOrder,
  handleAddressChange,
  handleSelectAddress,
  setBudget,
  setSelectedAllergies,
  setSelectedPreferences,
  setSelectedFoodType,
  setOtherAllergyText,
  setOtherPreferenceText,
  handleFinishEditing,
  handleConfirmOrder,
  inputSectionAnimation,
  inputError,
  isTyping,
  renderActionButton
}) => {
  // 地址输入
  if (stepData.showAddressInput) {
    return (
      <View>
        <AddressAutocomplete
          value={address}
          onChangeText={handleAddressChange}
          onSelectAddress={handleSelectAddress}
          placeholder="请输入地址"
          iconName="location-on"
          editable={!isAddressConfirmed || editingStep === 0}
          isDisabled={isAddressConfirmed && editingStep !== 0}
          animationValue={inputSectionAnimation}
          errorMessage={inputError}
        />
      </View>
    );
  }
  
  // 食物类型选择
  if (stepData.showFoodTypeInput) {
    const optionsToShow = isFreeOrder 
      ? FOOD_TYPE_OPTIONS.filter(option => option.id === 'drink')
      : FOOD_TYPE_OPTIONS;
    
    return (
      <ImageCheckbox
        options={optionsToShow}
        selectedIds={selectedFoodType}
        onSelectionChange={setSelectedFoodType}
        animationValue={inputSectionAnimation}
        singleSelect={true}
        disabled={isFreeOrder}
      />
    );
  }
  
  // 预算输入
  if (stepData.showBudgetInput) {
    const isSelectedDrink = selectedFoodType.includes('drink');
    const budgetOptions = isSelectedDrink ? BUDGET_OPTIONS_DRINK : BUDGET_OPTIONS_FOOD;
    
    return (
      <View>
        <BudgetInput
          value={budget}
          onChangeText={setBudget}
          animationValue={inputSectionAnimation}
          onSubmitEditing={editingStep === 4 ? handleFinishEditing : undefined}
          errorMessage={inputError}
          budgetOptions={budgetOptions}
        />
        {budget && (
          <PaymentComponent
            budget={budget}
            animationValue={inputSectionAnimation}
            onConfirmOrder={handleConfirmOrder}
            isTyping={isTyping}
            isFreeOrder={isFreeOrder}
          />
        )}
      </View>
    );
  }
  
  // 过敏选择
  if (stepData.showAllergyInput) {
    return (
      <ImageCheckbox
        options={ALLERGY_OPTIONS}
        selectedIds={selectedAllergies}
        onSelectionChange={setSelectedAllergies}
        animationValue={inputSectionAnimation}
        onOtherTextChange={setOtherAllergyText}
      />
    );
  }
  
  // 偏好选择
  if (stepData.showPreferenceInput) {
    return (
      <ImageCheckbox
        options={PREFERENCE_OPTIONS}
        selectedIds={selectedPreferences}
        onSelectionChange={setSelectedPreferences}
        animationValue={inputSectionAnimation}
        singleSelect={true}
        onOtherTextChange={setOtherPreferenceText}
      />
    );
  }
  
  return null;
};

interface FormActionButtonContainerProps {
  editingStep: number | null;
  currentStep: number;
  budget: string;
  address: string;
  canProceed: boolean;
  
  // Action handlers
  handleFinishEditing: () => void;
  handleCancelEditing: () => void;
  handleAddressConfirm: () => void;
  handleNext: () => void;
  
  // Animation
  inputSectionAnimation: Animated.Value;
}

export const FormActionButtonContainer: React.FC<FormActionButtonContainerProps> = ({
  editingStep,
  currentStep,
  budget,
  address,
  canProceed,
  handleFinishEditing,
  handleCancelEditing,
  handleAddressConfirm,
  handleNext,
  inputSectionAnimation
}) => {
  // 编辑模式下的按钮
  if (editingStep !== null) {
    return (
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <ActionButton
          onPress={handleFinishEditing}
          title="保存"
          disabled={!canProceed}
          isActive={canProceed}
          animationValue={inputSectionAnimation}
        />
        <ActionButton
          onPress={handleCancelEditing}
          title="取消"
          disabled={false}
          isActive={false}
          animationValue={inputSectionAnimation}
        />
      </View>
    );
  }
  
  // 地址确认按钮
  if (currentStep === 0) {
    return (
      <ActionButton
        onPress={handleAddressConfirm}
        title="确认"
        disabled={!address.trim() || address.trim().length < 5}
        isActive={!!address.trim() && address.trim().length >= 5}
        animationValue={inputSectionAnimation}
      />
    );
  }
  
  // 预算步骤特殊处理 - 选择了预算后不显示确认按钮
  if (currentStep === 4 && budget) {
    return null;
  }
  
  // 通用下一步按钮
  if (canProceed) {
    return (
      <ActionButton
        onPress={handleNext}
        title="确认"
        variant="next"
        animationValue={inputSectionAnimation}
      />
    );
  }
  
  return null;
};