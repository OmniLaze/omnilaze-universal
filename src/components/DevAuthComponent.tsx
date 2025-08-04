import React from 'react';
import { View, Text } from 'react-native';
import { ActionButton } from './ActionButton';
import { AuthResult, AuthComponentProps } from './AuthComponent';
import { DEV_CONFIG } from '../constants';
import { useTheme } from '../contexts/ColorThemeContext';

export const DevAuthComponent: React.FC<AuthComponentProps> = ({
  onAuthSuccess,
  onError,
  onQuestionChange,
  animationValue,
  triggerShake,
  changeEmotion,
}) => {
  const { theme } = useTheme();
  const handleDevLogin = () => {
    changeEmotion('🔧');
    
    // 模拟开发登录成功
    const mockAuthResult: AuthResult = {
      success: true,
      isNewUser: DEV_CONFIG.MOCK_USER.is_new_user,
      userId: DEV_CONFIG.MOCK_USER.user_id,
      phoneNumber: DEV_CONFIG.MOCK_USER.phone_number,
      message: '开发模式登录成功'
    };
    
    setTimeout(() => {
      changeEmotion('✅');
      onAuthSuccess(mockAuthResult);
    }, 500);
  };

  return (
    <View>
      <View style={{
        backgroundColor: theme.WARNING_BACKGROUND,
        borderWidth: 1,
        borderColor: theme.WARNING_BORDER,
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
      }}>
        <Text style={{
          color: theme.WARNING_TEXT,
          fontSize: 14,
          fontWeight: '500',
          textAlign: 'center',
          marginBottom: 8,
        }}>
          🔧 开发模式
        </Text>
        <Text style={{
          color: theme.WARNING_TEXT,
          fontSize: 12,
          textAlign: 'center',
          lineHeight: 16,
        }}>
          当前处于开发模式，将跳过JWT认证步骤{'\n'}
          点击下方按钮直接进入应用
        </Text>
      </View>
      
      <ActionButton
        onPress={handleDevLogin}
        title="开发模式登录"
        disabled={false}
        isActive={true}
        animationValue={animationValue}
      />
      
      <Text style={{
        color: theme.TEXT_SECONDARY,
        fontSize: 12,
        textAlign: 'center',
        marginTop: 12,
        fontStyle: 'italic',
      }}>
        模拟用户: {DEV_CONFIG.MOCK_USER.phone_number}
      </Text>
    </View>
  );
};