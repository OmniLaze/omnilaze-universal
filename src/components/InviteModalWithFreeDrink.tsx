import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform, ScrollView, Animated, Easing } from 'react-native';
import { SimpleIcon } from './SimpleIcon';
import { COLORS } from '../constants';
import { 
  getUserInviteStats, 
  getInviteProgress, 
  getFreeDrinksRemaining,
  claimFreeDrink,
  UserInviteStatsResponse, 
  InviteProgressResponse 
} from '../services/api';

interface InviteModalWithFreeDrinkProps {
  isVisible: boolean;
  onClose: () => void;
  onFreeDrinkClaim: () => void; // 点击免单按钮的回调
  userPhoneNumber: string;
  userId: string;
}

export const InviteModalWithFreeDrink: React.FC<InviteModalWithFreeDrinkProps> = ({
  isVisible,
  onClose,
  onFreeDrinkClaim,
  userPhoneNumber,
  userId,
}) => {
  const [copied, setCopied] = useState(false);
  const [inviteStats, setInviteStats] = useState<UserInviteStatsResponse | null>(null);
  const [inviteProgress, setInviteProgress] = useState<InviteProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [freeDrinksRemaining, setFreeDrinksRemaining] = useState<number>(100);
  
  // 动画相关状态
  const [showFreeDrinkOffer, setShowFreeDrinkOffer] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressOpacity = useRef(new Animated.Value(1)).current;
  const freeDrinkOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // 获取数据
  useEffect(() => {
    if (isVisible && userId) {
      loadAllData();
    }
  }, [isVisible, userId]);

  // 检查是否应该显示免单动画
  useEffect(() => {
    if (inviteStats && !loading) {
      // 检查免单资格：邀请满3人 + 未领取过 + 全局还有名额
      const isEligible = inviteStats.eligible_for_free_drink && 
                        !inviteStats.free_drink_claimed && 
                        freeDrinksRemaining > 0;
      
      if (isEligible && !showFreeDrinkOffer) {
        // 延迟显示动画，让用户先看到3/3的成就感
        setTimeout(() => {
          triggerFreeDrinkAnimation();
        }, 1000);
      }
    }
  }, [inviteStats, loading, freeDrinksRemaining]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsResponse, progressResponse, freeDrinksResponse] = await Promise.all([
        getUserInviteStats(userId),
        getInviteProgress(userId),
        getFreeDrinksRemaining()
      ]);
      
      if (statsResponse.success) {
        setInviteStats(statsResponse);
      }
      
      if (progressResponse.success) {
        setInviteProgress(progressResponse);
      }

      if (freeDrinksResponse.success && freeDrinksResponse.free_drinks_remaining !== undefined) {
        setFreeDrinksRemaining(freeDrinksResponse.free_drinks_remaining);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerFreeDrinkAnimation = () => {
    setShowFreeDrinkOffer(true);
    
    // 第一阶段：渐隐进度条
    Animated.timing(progressOpacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      // 第二阶段：渐显免单内容
      Animated.parallel([
        Animated.timing(freeDrinkOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      ]).start();
    });
  };

  const handleFreeDrinkClaim = async () => {
    try {
      const response = await claimFreeDrink(userId);
      if (response.success) {
        onFreeDrinkClaim();
        onClose();
      }
    } catch (error) {
      console.error('领取免单失败:', error);
    }
  };

  // 生成邀请码（fallback）
  const generateInviteCode = (phoneNumber: string): string => {
    const hash = phoneNumber.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `INV${Math.abs(hash).toString().substr(0, 6)}`;
  };

  const inviteCode = inviteStats?.user_invite_code || generateInviteCode(userPhoneNumber);
  const inviteText = `懒得点外卖？就用懒得！使用我的邀请码 ${inviteCode} 到order.omnilaze.co注册，邀请三位新用户注册可获得免费奶茶一杯哦！🧋`;

  // 复制功能
  const copyToClipboard = async (text: string) => {
    try {
      if (Platform.OS === 'web') {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(text);
        } else {
          const textArea = document.createElement('textarea');
          textArea.value = text;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyInviteCode = () => copyToClipboard(inviteCode);
  const handleCopyInviteText = () => copyToClipboard(inviteText);

  const currentUses = inviteStats?.current_uses || 0;
  const maxUses = inviteStats?.max_uses || 2;
  const isCompleted = currentUses >= maxUses;

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={styles.modal}>
          {/* 标题栏 */}
          <View style={styles.header}>
            <Text style={styles.title}>邀请朋友</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <SimpleIcon name="close" size={20} color={COLORS.TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>

          {/* 内容 */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.description}>
              分享你的邀请码，让朋友也懒得点外卖吧
            </Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>加载中...</Text>
              </View>
            ) : (
              <>
                {/* 邀请码 */}
                <View style={styles.inviteCodeContainer}>
                  <Text style={styles.inviteCodeLabel}>你的邀请码</Text>
                  <View style={styles.inviteCodeBox}>
                    <Text style={styles.inviteCodeText}>{inviteCode}</Text>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={handleCopyInviteCode}
                      activeOpacity={0.7}
                    >
                      <SimpleIcon 
                        name={copied ? "check" : "copy"} 
                        size={16} 
                        color={copied ? "#10b981" : COLORS.PRIMARY} 
                      />
                    </TouchableOpacity>
                  </View>
                  
                  {/* 邀请进度区域 */}
                  <View style={styles.progressSection}>
                    {!showFreeDrinkOffer ? (
                      // 常规进度显示
                      <Animated.View 
                        style={[
                          styles.statsContainer,
                          { opacity: progressOpacity }
                        ]}
                      >
                        <Text style={styles.statsText}>
                          已邀请 {currentUses}/{maxUses} 人
                        </Text>
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { 
                                width: `${(currentUses / maxUses) * 100}%`,
                                backgroundColor: isCompleted ? '#10b981' : COLORS.PRIMARY
                              }
                            ]} 
                          />
                        </View>
                        {isCompleted && (
                          <>
                            <Text style={styles.completedText}>
                              🎉 恭喜完成邀请任务！
                            </Text>
                            {/* 名额用完提示 */}
                            {(inviteStats?.free_drink_claimed || freeDrinksRemaining <= 0) && (
                              <Text style={styles.quotaEndedText}>
                                {inviteStats?.free_drink_claimed 
                                  ? "您已领取过免单奶茶" 
                                  : "免单名额已用完，下次要更快哦！"}
                              </Text>
                            )}
                          </>
                        )}
                      </Animated.View>
                    ) : (
                      // 免单奖励显示
                      <Animated.View 
                        style={[
                          styles.freeDrinkContainer,
                          {
                            opacity: freeDrinkOpacity,
                            transform: [
                              { scale: scaleAnim },
                              { 
                                translateY: slideAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [20, 0]
                                })
                              }
                            ]
                          }
                        ]}
                      >
                        <Text style={styles.freeDrinkTitle}>
                          恭喜您获得免单奶茶！
                        </Text>
                        <Text style={styles.freeDrinkSubtitle}>
                          成功邀请2位好友的奖励
                        </Text>
                        <Text style={styles.freeDrinkQuota}>
                          仅限前{freeDrinksRemaining}名，立即领取！
                        </Text>
                        
                        <View style={styles.drinkActionRow}>
                          <Text style={styles.drinkEmoji}>🧋</Text>
                          <TouchableOpacity
                            style={styles.claimButton}
                            onPress={handleFreeDrinkClaim}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.claimButtonText}>
                              立即免单
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </Animated.View>
                    )}
                  </View>
                </View>

                {/* 邀请记录 */}
                {inviteProgress && inviteProgress.invitations && inviteProgress.invitations.length > 0 && (
                  <View style={styles.inviteProgressContainer}>
                    <Text style={styles.progressLabel}>邀请记录</Text>
                    {inviteProgress.invitations.map((invitation, index) => (
                      <View key={index} style={styles.invitationCard}>
                        <View style={styles.invitationHeader}>
                          <SimpleIcon name="person" size={16} color={COLORS.PRIMARY} />
                          <Text style={styles.invitationPhone}>{invitation.masked_phone}</Text>
                        </View>
                        <Text style={styles.invitationDate}>
                          {new Date(invitation.invited_at).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* 邀请文本 */}
                <View style={styles.inviteTextContainer}>
                  <Text style={styles.inviteTextLabel}>分享文本</Text>
                  <View style={styles.inviteTextBox}>
                    <Text style={styles.inviteText}>{inviteText}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.copyTextButton}
                    onPress={handleCopyInviteText}
                    activeOpacity={0.7}
                  >
                    <SimpleIcon name="copy" size={16} color={COLORS.WHITE} />
                    <Text style={styles.copyTextButtonText}>复制邀请文本</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modal: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 20,
    lineHeight: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  inviteCodeContainer: {
    marginBottom: 24,
  },
  inviteCodeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  inviteCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  inviteCodeText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: 8,
  },
  progressSection: {
    marginTop: 12,
    minHeight: 40, // 减小最小高度，减少不必要的间距
  },
  statsContainer: {
    marginBottom: 8,
  },
  statsText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 3,
  },
  completedText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  quotaEndedText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // 免单相关样式
  freeDrinkContainer: {
    alignItems: 'center',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: 16,
    padding: 16,
    marginTop: 4, // 减少顶部边距
  },
  freeDrinkTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.WHITE,
    textAlign: 'center',
    marginBottom: 4,
  },
  freeDrinkSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 6,
  },
  freeDrinkQuota: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 12,
  },
  drinkActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1.6, // 缩小到原来的1/10 (16 → 1.6)
  },
  drinkEmoji: {
    fontSize: 40,
  },
  claimButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  claimButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  // 其他样式保持不变
  inviteProgressContainer: {
    marginBottom: 24,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  invitationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  invitationPhone: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: 8,
    fontWeight: '500',
  },
  invitationDate: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  inviteTextContainer: {
    marginBottom: 8,
  },
  inviteTextLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  inviteTextBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inviteText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  copyTextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  copyTextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginLeft: 8,
  },
});