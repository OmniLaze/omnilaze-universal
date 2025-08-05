import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ColorPalette from './src/components/ColorPalette';
import { ColorThemeProvider, useTheme } from './src/contexts/ColorThemeContext';
import { DEV_CONFIG } from './src/constants';

function TestAppContent() {
  const { 
    theme, 
    themeState, 
    isDebugMode, 
    updatePrimaryColor, 
    updateBackgroundColor, 
    updatePrimaryOpacity,
    updateBackgroundOpacity,
    updateTextColors,
    updateAllColors,
    toggleDebugMode 
  } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.BACKGROUND }]}>
      <Text style={[styles.title, { color: theme.PRIMARY }]}>
        调色板测试应用
      </Text>
      
      <View style={[styles.card, { backgroundColor: theme.WHITE, borderColor: theme.BORDER }]}>
        <Text style={[styles.cardTitle, { color: theme.TEXT_PRIMARY }]}>
          示例卡片
        </Text>
        <Text style={[styles.cardText, { color: theme.TEXT_SECONDARY }]}>
          这是一个测试卡片，用来展示颜色变化效果。
        </Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.PRIMARY }]}
        >
          <Text style={styles.buttonText}>示例按钮</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: theme.WHITE, borderColor: theme.BORDER }]}>
        <Text style={[styles.cardTitle, { color: theme.TEXT_PRIMARY }]}>
          当前主题颜色
        </Text>
        <Text style={[styles.colorInfo, { color: theme.TEXT_SECONDARY }]}>
          主色调: {theme.PRIMARY}
        </Text>
        <Text style={[styles.colorInfo, { color: theme.TEXT_SECONDARY }]}>
          背景色: {theme.BACKGROUND}
        </Text>
      </View>

      {/* 调色板调试工具 */}
      {DEV_CONFIG.ENABLE_COLOR_PALETTE && isDebugMode && (
        <ColorPalette
          primaryColor={theme.PRIMARY}
          backgroundColor={theme.BACKGROUND}
          primaryOpacity={themeState.opacity.primary}
          backgroundOpacity={themeState.opacity.background}
          onPrimaryColorChange={updatePrimaryColor}
          onBackgroundColorChange={updateBackgroundColor}
          onPrimaryOpacityChange={updatePrimaryOpacity}
          onBackgroundOpacityChange={updateBackgroundOpacity}
          onTextColorsChange={updateTextColors}
          onAllColorsChange={updateAllColors}
          onClose={() => toggleDebugMode()}
        />
      )}

      {/* 调色板开关按钮 */}
      {DEV_CONFIG.ENABLE_COLOR_PALETTE && (
        <TouchableOpacity
          style={[
            styles.floatingButton,
            { 
              backgroundColor: theme.PRIMARY,
              zIndex: isDebugMode ? 999 : 1001 
            }
          ]}
          onPress={toggleDebugMode}
        >
          <Text style={styles.floatingButtonText}>🎨</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ColorPaletteTest() {
  return (
    <ColorThemeProvider>
      <TestAppContent />
    </ColorThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  colorInfo: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  floatingButtonText: {
    fontSize: 24,
  },
});