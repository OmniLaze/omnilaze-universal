import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Platform, Dimensions } from 'react-native';
import { SimpleIcon } from './SimpleIcon';
import { COLORS } from '../constants';

const { width } = Dimensions.get('window');

interface UserMenuProps {
  isVisible: boolean;
  onLogout: () => void;
  onInvite: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  isVisible,
  onLogout,
  onInvite,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showBubble, setShowBubble] = useState(true); // 控制气泡显示

  const toggleDropdown = () => {
    console.log('Toggle dropdown clicked, current state:', showDropdown);
    setShowDropdown(!showDropdown);
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    setShowDropdown(false);
    onLogout();
  };

  const handleInvite = () => {
    console.log('Invite clicked');
    setShowDropdown(false);
    setShowBubble(false); // 点击邀请后隐藏气泡
    onInvite();
  };

  const handleBubbleClick = () => {
    setShowBubble(false); // 点击气泡后隐藏
    handleInvite(); // 直接触发邀请功能
  };

  // 10秒后自动隐藏气泡
  useEffect(() => {
    if (showBubble) {
      const timer = setTimeout(() => {
        setShowBubble(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showBubble]);

  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* 邀请提示气泡 */}
      {showBubble && (
        <TouchableOpacity
          style={styles.inviteBubble}
          onPress={handleBubbleClick}
          activeOpacity={0.8}
        >
          <View style={styles.bubbleContent}>
            <Text style={styles.bubbleText}>邀请新用户免单奶茶哦 🎉</Text>
          </View>
          <View style={styles.bubbleArrow} />
        </TouchableOpacity>
      )}
      
      {/* 三个点按钮 */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={toggleDropdown}
        activeOpacity={0.7}
      >
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </TouchableOpacity>

      {/* 下拉菜单 */}
      {showDropdown && (
        <View style={styles.dropdown}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleInvite}
            activeOpacity={0.7}
          >
            <SimpleIcon name="gift" size={16} color={COLORS.PRIMARY} />
            <Text style={styles.menuItemText}>邀请</Text>
          </TouchableOpacity>
          
          <View style={styles.separator} />
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <SimpleIcon name="exit" size={16} color="#ef4444" />
            <Text style={[styles.menuItemText, { color: '#ef4444' }]}>登出</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 点击外部关闭下拉菜单的遮罩 */}
      {showDropdown && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setShowDropdown(false)}
          activeOpacity={1}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: width > 768 ? 120 : 70,
    right: width > 768 ? 185 : 16,
    zIndex: 1000,
  },
  menuButton: {
    width: width > 768 ? 40 : 36,
    height: width > 768 ? 40 : 36,
    borderRadius: width > 768 ? 20 : 18,
    backgroundColor: COLORS.WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dot: {
    width: width > 768 ? 4 : 3,
    height: width > 768 ? 4 : 3,
    borderRadius: width > 768 ? 2 : 1.5,
    backgroundColor: COLORS.TEXT_PRIMARY,
    marginVertical: 0.5,
  },
  dropdown: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 120,
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1001,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 12,
  },
  overlay: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 1000,
    height: 1000,
    zIndex: 999,
  },
  inviteBubble: {
    position: 'absolute',
    top: 0,
    right: 50,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: width > 768 ? 20 : 18,
    paddingHorizontal: width > 768 ? 20 : 16, // 增加水平内边距
    paddingVertical: 0,
    height: width > 768 ? 40 : 36,
    minWidth: width > 768 ? 200 : 180, // 设置最小宽度
    justifyContent: 'center',
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1002,
  },
  bubbleContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleText: {
    color: COLORS.WHITE,
    fontSize: width > 768 ? 14 : 12, // 调整字体大小
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: width > 768 ? 16 : 14,
  },
  bubbleArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -6,
    right: -5,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: COLORS.PRIMARY,
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
});