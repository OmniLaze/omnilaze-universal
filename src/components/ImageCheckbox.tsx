import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Animated, TextInput, Dimensions } from 'react-native';
import { SimpleIcon } from './SimpleIcon';
import { StyleSheet } from 'react-native';
import { COLORS } from '../constants';

const { width } = Dimensions.get('window');

interface ImageCheckboxOption {
  id: string;
  label: string;
  image: any; // 图片资源
}

interface ImageCheckboxProps {
  options: ImageCheckboxOption[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  animationValue?: Animated.Value;
  singleSelect?: boolean; // 新增：是否单选模式
  onOtherTextChange?: (text: string) => void; // 新增：其他输入框文本变化回调
  disabled?: boolean; // 新增：是否禁用选择
}

export const ImageCheckbox: React.FC<ImageCheckboxProps> = ({
  options,
  selectedIds,
  onSelectionChange,
  animationValue,
  singleSelect = false, // 默认多选
  onOtherTextChange,
  disabled = false, // 默认不禁用
}) => {
  const [shouldRender, setShouldRender] = useState(true); // 修改：默认为true，确保组件能够正常渲染
  const [otherText, setOtherText] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherInputAnimation] = useState(new Animated.Value(0)); // 使用useState保持动画实例

  useEffect(() => {
    // 检查是否已经选中了“其他”选项，如果是则显示输入框
    const hasOtherSelected = selectedIds.some(id => id.includes('other'));
    if (hasOtherSelected && !showOtherInput) {
      setShowOtherInput(true);
      otherInputAnimation.setValue(1);
    } else if (!hasOtherSelected && showOtherInput) {
      hideOtherInput();
    }
  }, [selectedIds]);

  useEffect(() => {
    if (animationValue) {
      // 监听动画值变化
      const listener = animationValue.addListener(({ value }) => {
        // 修复：一旦动画开始就应该渲染，不要因为动画值变为0就停止渲染
        setShouldRender(value > 0 || selectedIds.length > 0);
      });

      return () => {
        animationValue.removeListener(listener);
      };
    } else {
      // 如果没有动画值，总是渲染
      setShouldRender(true);
    }
  }, [animationValue, selectedIds.length]);

  const toggleOption = (optionId: string) => {
    // 如果组件被禁用，不允许切换选择
    if (disabled) return;
    
    const isSelected = selectedIds.includes(optionId);
    const isOtherOption = optionId.includes('other');
    let newSelection: string[];
    
    if (singleSelect) {
      // 单选模式
      if (isSelected) {
        // 在单选模式下，如果点击已选择的项目，保持选择状态
        // 这样确保始终有一个选项被选中
        newSelection = selectedIds;
      } else {
        // 选择当前项，取消其他选择
        newSelection = [optionId];
        // 如果选择了其他选项，显示输入框
        if (isOtherOption) {
          showOtherInputAnimated();
        } else {
          // 如果选择了非其他选项，隐藏输入框
          hideOtherInput();
        }
      }
    } else {
      // 多选模式（原逻辑）
      if (isSelected) {
        // 取消选择
        newSelection = selectedIds.filter(id => id !== optionId);
        // 如果取消选择的是其他选项，隐藏输入框
        if (isOtherOption) {
          hideOtherInput();
        }
      } else {
        // 添加选择
        newSelection = [...selectedIds, optionId];
        // 如果选择了其他选项，显示输入框
        if (isOtherOption) {
          showOtherInputAnimated();
        }
      }
    }
    
    onSelectionChange(newSelection);
  };

  const showOtherInputAnimated = () => {
    setShowOtherInput(true);
    Animated.spring(otherInputAnimation, {
      toValue: 1,
      tension: 80,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };

  const hideOtherInput = () => {
    Animated.spring(otherInputAnimation, {
      toValue: 0,
      tension: 80,
      friction: 8,
      useNativeDriver: false,
    }).start(() => {
      setShowOtherInput(false);
      setOtherText('');
      if (onOtherTextChange) {
        onOtherTextChange('');
      }
    });
  };

  const handleOtherTextChange = (text: string) => {
    setOtherText(text);
    if (onOtherTextChange) {
      onOtherTextChange(text);
    }
  };

  // 如果不应该渲染，返回null
  if (!shouldRender) {
    return null;
  }

  const WrapperComponent = animationValue ? Animated.View : View;
  const wrapperProps = animationValue 
    ? {
        style: [
          styles.container,
          {
            opacity: animationValue,
            transform: [{
              translateY: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          },
        ],
      }
    : { style: styles.container };

  return (
    <WrapperComponent {...wrapperProps}>
      <View style={styles.grid}>
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                isSelected && styles.selectedCard,
                disabled && styles.disabledCard
              ]}
              onPress={() => toggleOption(option.id)}
              activeOpacity={disabled ? 1 : 0.7}
              disabled={disabled}
            >
              <View style={styles.imageContainer}>
                <Image 
                  source={option.image} 
                  style={styles.optionImage}
                  resizeMode="contain"
                />
              </View>
              
              {/* 文本标签容器 - Safari 兼容性 */}
              <View style={styles.labelContainer}>
                <Text 
                  style={[
                    styles.optionLabel,
                    isSelected && styles.selectedLabel
                  ]}
                  numberOfLines={2}
                  // 移除 adjustsFontSizeToFit 以避免 Safari 兼容性问题
                  // adjustsFontSizeToFit={true}
                  // minimumFontScale={0.8}
                >
                  {option.label}
                </Text>
              </View>
              
              <View style={[
                styles.checkbox,
                isSelected && styles.checkedBox
              ]}>
                {isSelected && (
                  <SimpleIcon 
                    name="check" 
                    size={width > 768 ? 18 : 14} 
                    color={COLORS.WHITE} 
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* 其他输入框 */}
      {showOtherInput && (
        <Animated.View
          style={[
            styles.otherInputContainer,
            {
              opacity: otherInputAnimation,
              transform: [{
                translateY: otherInputAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          <TextInput
            style={styles.otherInput}
            placeholder="请描述具体内容..."
            value={otherText}
            onChangeText={handleOtherTextChange}
            autoFocus={true}
            multiline={false}
            returnKeyType="done"
          />
        </Animated.View>
      )}
    </WrapperComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: width > 768 ? 16 : 8, // 移动端减少顶部间距
    maxWidth: 500,
  },
  grid: {
    flexDirection: width > 768 ? 'row' : 'column',
    flexWrap: width > 768 ? 'wrap' : 'nowrap',
    gap: width > 768 ? 8 : 4,
    justifyContent: width > 768 ? 'center' : 'flex-start',
  },
  optionCard: {
    width: width > 768 ? '31%' : '100%',
    aspectRatio: width > 768 ? 0.66 : undefined,
    height: width > 768 ? undefined : 68,
    backgroundColor: COLORS.WHITE,
    borderRadius: width > 768 ? 12 : 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderLeftWidth: width > 768 ? 2 : 4, // 移动端统一左边框宽度
    padding: width > 768 ? 12 : 12,
    alignItems: 'center',
    justifyContent: width > 768 ? 'space-between' : 'flex-start',
    flexDirection: width > 768 ? 'column' : 'row',
    position: 'relative',
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedCard: {
    borderColor: COLORS.PRIMARY,
    borderLeftColor: COLORS.PRIMARY, // 确保选中时左边框也是主色
  },
  imageContainer: {
    width: width > 768 ? 160 : 80, // 移动端放大图片容器
    height: width > 768 ? 160 : 80,
    alignItems: 'center',
    justifyContent: 'center',
    flex: width > 768 ? 1 : 0,
    marginRight: width > 768 ? 0 : 55, // 增加右边距
    marginLeft: width > 768 ? 0 : 50, // 增加左边距
  },
  optionImage: {
    width: width > 768 ? 144 : 75, // 移动端放大图片，从32增加到40
    height: width > 768 ? 144 : 75,
  },
  labelContainer: {
    // Safari 兼容性容器
    flex: width > 768 ? 0 : 1,
    minHeight: width > 768 ? 25 : 20,
    justifyContent: 'center',
    alignItems: width > 768 ? 'center' : 'flex-start',
    marginRight: width > 768 ? 0 : 12,
    marginVertical: width > 768 ? 8 : 0,
    marginBottom: width > 768 ? 16 : 0,
  },
  optionLabel: {
    fontSize: width > 768 ? 21 : 16,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    textAlign: width > 768 ? 'center' : 'left',
    // Safari 兼容性修复
    lineHeight: width > 768 ? 25 : 20,
    // 移除可能导致 Safari 问题的样式
    // flex: width > 768 ? 0 : 1,
    // marginRight: width > 768 ? 0 : 12,
    // marginVertical: width > 768 ? 8 : 0,
    // marginBottom: width > 768 ? 16 : 0,
    // display: 'flex',
    // alignItems: width > 768 ? 'center' : 'flex-start',
    // justifyContent: width > 768 ? 'center' : 'flex-start',
  },
  selectedLabel: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  checkbox: {
    width: width > 768 ? 22 : 18,
    height: width > 768 ? 22 : 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.WHITE,
    position: width > 768 ? 'static' : 'absolute',
    right: width > 768 ? 'auto' : 12,
  },
  checkedBox: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  disabledCard: {
    opacity: 0.8,
    backgroundColor: '#f8f9fa',
  },
  otherInputContainer: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: width > 768 ? 0 : 8, // 移动端添加左右内边距
  },
  otherInput: {
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: width > 768 ? 12 : 10, // 移动端调整内边距
    fontSize: width > 768 ? 16 : 14, // 移动端调整字体大小
    backgroundColor: COLORS.WHITE,
    color: COLORS.TEXT_PRIMARY,
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minHeight: width > 768 ? 44 : 40, // 设置最小高度便于点击
  },
});