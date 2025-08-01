import { useEffect } from 'react';
import { Animated } from 'react-native';
import { STEP_CONTENT } from '../data/stepContent';
import { ALLERGY_OPTIONS, PREFERENCE_OPTIONS, FOOD_TYPE_OPTIONS } from '../data/checkboxOptions';
import type { Answer, AddressSuggestion, CompletedAnswers } from '../types';

interface UseFormStepsProps {
  // State values
  address: string;
  budget: string;
  selectedAllergies: string[];
  selectedPreferences: string[];
  selectedFoodType: string[];
  otherAllergyText: string;
  otherPreferenceText: string;
  currentStep: number;
  editingStep: number | null;
  completedAnswers: CompletedAnswers;
  originalAnswerBeforeEdit: Answer | null;
  isFreeOrder: boolean;
  isAddressConfirmed: boolean;
  showMap: boolean;
  selectedAddressSuggestion: AddressSuggestion | null;
  isAuthenticated: boolean;
  authQuestionText: string;
  
  // State setters
  setAddress: (value: string) => void;
  setBudget: (value: string) => void;
  setSelectedAllergies: (value: string[]) => void;
  setSelectedPreferences: (value: string[]) => void;
  setSelectedFoodType: (value: string[]) => void;
  setOtherAllergyText: (value: string) => void;
  setOtherPreferenceText: (value: string) => void;
  setCurrentStep: (value: number) => void;
  setCompletedAnswers: (value: CompletedAnswers | ((prev: CompletedAnswers) => CompletedAnswers)) => void;
  setEditingStep: (value: number | null) => void;
  setOriginalAnswerBeforeEdit: (value: Answer | null) => void;
  setIsAddressConfirmed: (value: boolean) => void;
  setShowMap: (value: boolean) => void;
  setSelectedAddressSuggestion: (value: AddressSuggestion | null) => void;
  setCurrentOrderId: (value: string | null) => void;
  setCurrentOrderNumber: (value: string | null) => void;
  setCurrentUserSequenceNumber: (value: number | null) => void;
  setIsOrderSubmitting: (value: boolean) => void;
  setIsSearchingRestaurant: (value: boolean) => void;
  
  // Animation values
  mapAnimation: Animated.Value;
  answerAnimations: Animated.Value[];
  
  // Validation & Animation functions
  validateInput: (step: number, value: any) => { isValid: boolean };
  triggerShake: () => void;
  changeEmotion: (emotion: string) => void;
}

export const useFormSteps = (props: UseFormStepsProps) => {
  const {
    address, budget, selectedAllergies, selectedPreferences, selectedFoodType,
    otherAllergyText, otherPreferenceText, currentStep, editingStep, completedAnswers,
    originalAnswerBeforeEdit, isFreeOrder, isAddressConfirmed, showMap,
    selectedAddressSuggestion, isAuthenticated, authQuestionText,
    setAddress, setBudget, setSelectedAllergies, setSelectedPreferences, setSelectedFoodType,
    setOtherAllergyText, setOtherPreferenceText, setCurrentStep, setCompletedAnswers,
    setEditingStep, setOriginalAnswerBeforeEdit, setIsAddressConfirmed, setShowMap,
    setSelectedAddressSuggestion, setCurrentOrderId, setCurrentOrderNumber,
    setCurrentUserSequenceNumber, setIsOrderSubmitting, setIsSearchingRestaurant,
    mapAnimation, answerAnimations, validateInput, triggerShake, changeEmotion
  } = props;

  // 获取当前步骤数据
  const getCurrentStepData = () => {
    if (!isAuthenticated) {
      return {
        message: authQuestionText,
        showPhoneInput: true,
        inputType: 'phone'
      };
    }
    
    const stepData = STEP_CONTENT[currentStep];
    
    // 免单模式的特殊文本处理
    if (isFreeOrder && stepData) {
      switch (stepData.inputType) {
        case 'foodType':
          return {
            ...stepData,
            message: "我已经为您自动选择了奶茶 🧋"
          };
        case 'payment':
          return {
            ...stepData,
            message: "恭喜！您的免单奶茶已经不远了～"
          };
      }
    }
    
    // 特殊处理预算步骤，根据食物类型显示不同问题
    if (stepData && stepData.inputType === 'budget' && !isFreeOrder) {
      const isSelectedDrink = selectedFoodType.includes('drink');
      return {
        ...stepData,
        message: isSelectedDrink 
          ? "我可以花多少钱帮你买奶茶？" 
          : "我可以花多少钱帮你点外卖？"
      };
    }
    
    return stepData;
  };

  // 获取当前答案
  const getCurrentAnswer = (): Answer | null => {
    const stepToUse = editingStep !== null ? editingStep : currentStep;
    switch (stepToUse) {
      case 0: return { type: 'address', value: address };
      case 1: {
        const foodTypeLabels = selectedFoodType.map(id => {
          const option = FOOD_TYPE_OPTIONS.find(opt => opt.id === id);
          return option ? option.label : id;
        });
        return { type: 'foodType', value: foodTypeLabels.length > 0 ? foodTypeLabels.join(', ') : '未选择' };
      }
      case 2: {
        const allergyLabels = selectedAllergies.map(id => {
          if (id === 'other-allergy') {
            return otherAllergyText ? `其他: ${otherAllergyText}` : '其他';
          }
          const option = ALLERGY_OPTIONS.find(opt => opt.id === id);
          return option ? option.label : id;
        });
        return { type: 'allergy', value: allergyLabels.length > 0 ? allergyLabels.join(', ') : '无忌口' };
      }
      case 3: {
        const preferenceLabels = selectedPreferences.map(id => {
          if (id === 'other-preference') {
            return otherPreferenceText ? `其他: ${otherPreferenceText}` : '其他';
          }
          const option = PREFERENCE_OPTIONS.find(opt => opt.id === id);
          return option ? option.label : id;
        });
        return { type: 'preference', value: preferenceLabels.length > 0 ? preferenceLabels.join(', ') : '无特殊偏好' };
      }
      case 4: return { type: 'budget', value: budget };
      default: return null;
    }
  };

  // 格式化答案显示
  const formatAnswerDisplay = (answer: Answer) => {
    if (!answer) return '';
    switch (answer.type) {
      case 'address': return answer.value;
      case 'phone': return answer.value;
      case 'budget': return `¥${answer.value}`;
      case 'allergy': return answer.value || '无忌口';
      case 'preference': return answer.value || '无特殊偏好';
      case 'foodType': return answer.value || '未选择';
      default: return answer.value;
    }
  };

  // 检查是否可以继续
  const canProceed = () => {
    if (!isAuthenticated) {
      return false;
    }
    
    if (editingStep !== null) {
      const stepData = STEP_CONTENT[editingStep];
      switch (stepData.inputType) {
        case 'address':
          return !!address.trim() && address.trim().length >= 5;
        case 'foodType':
          return selectedFoodType.length > 0;
        case 'allergy':
        case 'preference':
          return true;
        case 'budget':
          return !!budget.trim() && parseFloat(budget) >= 10;
        default:
          return true;
      }
    }
    
    const stepData = getCurrentStepData();
    switch (stepData.inputType) {
      case 'address':
        return !!address.trim() && address.trim().length >= 5;
      case 'foodType':
        return selectedFoodType.length > 0;
      case 'allergy':
      case 'preference':
        return true;
      case 'budget':
        return !!budget.trim() && parseFloat(budget) >= 10;
      default:
        return true;
    }
  };

  // 处理地址变更
  const handleAddressChange = (text: string) => {
    setAddress(text);
    if (selectedAddressSuggestion && text !== selectedAddressSuggestion.description) {
      setSelectedAddressSuggestion(null);
    }
  };

  // 选择地址建议
  const handleSelectAddress = (suggestion: AddressSuggestion) => {
    setSelectedAddressSuggestion(suggestion);
    setAddress(suggestion.description);
  };

  // 确认地址
  const handleAddressConfirm = () => {
    if (!validateInput(0, address).isValid) {
      triggerShake();
      return;
    }
    
    setIsAddressConfirmed(true);
    changeEmotion('✅');
    
    setTimeout(() => {
      handleNext();
    }, 300);
  };

  // 处理下一步
  const handleNext = () => {
    const currentAnswer = getCurrentAnswer();
    const inputValue = currentAnswer?.value;
    
    if (!validateInput(currentStep, inputValue).isValid) {
      triggerShake();
      return;
    }
    
    changeEmotion('🎉');
    
    setCompletedAnswers(prev => ({
      ...prev,
      [currentStep]: currentAnswer!
    }));
    
    Animated.spring(answerAnimations[currentStep], {
      toValue: 1,
      tension: 60,
      friction: 8,
      useNativeDriver: false,
    }).start(() => {
      setTimeout(() => {
        let nextStep = currentStep + 1;
        
        if (currentStep === 1) {
          const isSelectedDrink = selectedFoodType.includes('drink');
          
          if (isSelectedDrink) {
            if (isFreeOrder) {
              setBudget('0');
            } else {
              nextStep = 4;
            }
          }
        }
        
        if (isFreeOrder && currentStep === 4) {
          setBudget('0');
          nextStep = currentStep;
        }
        
        if (nextStep < STEP_CONTENT.length) {
          setCurrentStep(nextStep);
        }
      }, 200);
    });
  };

  // 编辑地址
  const handleEditAddress = () => {
    setIsAddressConfirmed(false);
    setShowMap(false);
    setAddress('');
    mapAnimation.setValue(0);
  };

  // 编辑答案
  const handleEditAnswer = (stepIndex: number) => {
    const answerToEdit = completedAnswers[stepIndex];
    if (!answerToEdit) return;
    
    setOriginalAnswerBeforeEdit(answerToEdit);
    
    switch (answerToEdit.type) {
      case 'address':
        setAddress(answerToEdit.value);
        setIsAddressConfirmed(false);
        setShowMap(false);
        mapAnimation.setValue(0);
        break;
      case 'foodType':
        if (answerToEdit.value !== '未选择') {
          const labels = answerToEdit.value.split(', ');
          const ids = labels.map(label => {
            const option = FOOD_TYPE_OPTIONS.find(opt => opt.label === label);
            return option ? option.id : label;
          });
          setSelectedFoodType(ids);
        }
        break;
      case 'allergy':
        if (answerToEdit.value !== '无忌口') {
          const labels = answerToEdit.value.split(', ');
          const ids = labels.map(label => {
            const option = ALLERGY_OPTIONS.find(opt => opt.label === label);
            return option ? option.id : label;
          });
          setSelectedAllergies(ids);
        } else {
          setSelectedAllergies([]);
        }
        break;
      case 'preference':
        if (answerToEdit.value !== '无特殊偏好') {
          const labels = answerToEdit.value.split(', ');
          const ids = labels.map(label => {
            const option = PREFERENCE_OPTIONS.find(opt => opt.label === label);
            return option ? option.id : label;
          });
          setSelectedPreferences(ids);
        } else {
          setSelectedPreferences([]);
        }
        break;
      case 'budget':
        setBudget(answerToEdit.value);
        break;
    }
    
    setEditingStep(stepIndex);
  };

  // 完成编辑
  const handleFinishEditing = () => {
    const currentAnswer = getCurrentAnswer();
    if (currentAnswer && editingStep !== null) {
      if (!validateInput(editingStep, currentAnswer.value).isValid) {
        triggerShake();
        return;
      }
      
      setCompletedAnswers(prev => ({
        ...prev,
        [editingStep]: currentAnswer
      }));
      
      if (editingStep === 0) {
        setIsAddressConfirmed(true);
      }
      
      if (editingStep === 1) {
        const isSelectedDrink = selectedFoodType.includes('drink');
        
        setBudget('');
        
        setCurrentOrderId(null);
        setCurrentOrderNumber(null);
        setCurrentUserSequenceNumber(null);
        setIsOrderSubmitting(false);
        setIsSearchingRestaurant(false);
        
        if (isSelectedDrink) {
          const newCompletedAnswers = { ...completedAnswers };
          delete newCompletedAnswers[2];
          delete newCompletedAnswers[3];
          delete newCompletedAnswers[4];
          delete newCompletedAnswers[5];
          setCompletedAnswers({
            ...newCompletedAnswers,
            [editingStep]: currentAnswer
          });
          
          setSelectedAllergies([]);
          setSelectedPreferences([]);
          
          if (currentStep >= 4) {
            setCurrentStep(4);
          } else if (currentStep > 1) {
            setCurrentStep(4);
          }
        } else {
          const newCompletedAnswers = { ...completedAnswers };
          delete newCompletedAnswers[4];
          delete newCompletedAnswers[5];
          setCompletedAnswers({
            ...newCompletedAnswers,
            [editingStep]: currentAnswer
          });
          
          if (currentStep > 1 && currentStep < 4) {
            // 保持当前步骤
          } else if (currentStep >= 4) {
            setCurrentStep(2);
          }
        }
      }
      
      setEditingStep(null);
      setOriginalAnswerBeforeEdit(null);
    }
  };

  // 取消编辑
  const handleCancelEditing = () => {
    if (editingStep !== null && originalAnswerBeforeEdit) {
      switch (originalAnswerBeforeEdit.type) {
        case 'address':
          setAddress(originalAnswerBeforeEdit.value);
          setIsAddressConfirmed(true);
          break;
        case 'foodType':
          if (originalAnswerBeforeEdit.value !== '未选择') {
            const labels = originalAnswerBeforeEdit.value.split(', ');
            const ids = labels.map(label => {
              const option = FOOD_TYPE_OPTIONS.find(opt => opt.label === label);
              return option ? option.id : label;
            });
            setSelectedFoodType(ids);
          }
          break;
        case 'allergy':
          if (originalAnswerBeforeEdit.value !== '无忌口') {
            const labels = originalAnswerBeforeEdit.value.split(', ');
            const ids = labels.map(label => {
              const option = ALLERGY_OPTIONS.find(opt => opt.label === label);
              return option ? option.id : label;
            });
            setSelectedAllergies(ids);
          } else {
            setSelectedAllergies([]);
          }
          break;
        case 'preference':
          if (originalAnswerBeforeEdit.value !== '无特殊偏好') {
            const labels = originalAnswerBeforeEdit.value.split(', ');
            const ids = labels.map(label => {
              const option = PREFERENCE_OPTIONS.find(opt => opt.label === label);
              return option ? option.id : label;
            });
            setSelectedPreferences(ids);
          } else {
            setSelectedPreferences([]);
          }
          break;
        case 'budget':
          setBudget(originalAnswerBeforeEdit.value);
          break;
      }
      
      setEditingStep(null);
      setOriginalAnswerBeforeEdit(null);
    }
  };

  return {
    getCurrentStepData,
    getCurrentAnswer,
    formatAnswerDisplay,
    canProceed,
    handleAddressChange,
    handleSelectAddress,
    handleAddressConfirm,
    handleNext,
    handleEditAddress,
    handleEditAnswer,
    handleFinishEditing,
    handleCancelEditing
  };
};