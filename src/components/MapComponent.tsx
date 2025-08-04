import React from 'react';
import { View, Text, Platform, Animated } from 'react-native';
import { SimpleIcon } from './SimpleIcon';
import { mapStyles } from '../styles/mapStyles';
import { useTheme } from '../contexts/ColorThemeContext';

interface MapComponentProps {
  showMap: boolean;
  mapAnimation: Animated.Value;
}

export const MapComponent: React.FC<MapComponentProps> = ({ showMap, mapAnimation }) => {
  const { theme } = useTheme();
  
  if (Platform.OS === 'web') {
    return (
      <View style={mapStyles.webMapContainer}>
        <View style={mapStyles.webMapBackground}>
          <View style={mapStyles.streetLines}>
            <View style={[mapStyles.streetLine, { top: 80, left: 0, width: '100%', height: 1 }]} />
            <View style={[mapStyles.streetLine, { top: 160, left: 0, width: '100%', height: 1 }]} />
            <View style={[mapStyles.streetLine, { top: 240, left: 0, width: '100%', height: 1 }]} />
            <View style={[mapStyles.streetLine, { left: 128, top: 0, width: 1, height: '100%' }]} />
            <View style={[mapStyles.streetLine, { left: 256, top: 0, width: 1, height: '100%' }]} />
          </View>
          
          <Text style={[mapStyles.streetLabel, { top: 64, left: 16, transform: [{ rotate: '-12deg' }] }]}>
            Williamsburg Bridge
          </Text>
          <Text style={[mapStyles.streetLabel, { top: 144, left: 32 }]}>S 4th St</Text>
          <Text style={[mapStyles.streetLabel, { top: 224, left: 32 }]}>S 5th St</Text>
          <Text style={[mapStyles.streetLabel, { top: 96, left: 160, transform: [{ rotate: '90deg' }] }]}>
            Kent Ave
          </Text>
          
          <View style={mapStyles.webMapPin}>
            <View style={mapStyles.webMapPinCircle}>
              <View style={mapStyles.webMapPinInner} />
            </View>
            <View style={mapStyles.webMapPinStem} />
          </View>
          
          <View style={mapStyles.webMapBranding}>
            <Text style={mapStyles.webMapBrandingText}>Google</Text>
          </View>
          <Text style={mapStyles.webMapCopyright}>Map data ©2025 Google</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={mapStyles.map}>
      <View style={mapStyles.nativeMapPlaceholder}>
        <SimpleIcon name="location-on" size={48} color={theme.PRIMARY} />
        <Text style={mapStyles.nativeMapText}>Map View (Native)</Text>
        <Text style={mapStyles.nativeMapSubtext}>325 Kent Ave, Brooklyn, NY</Text>
      </View>
    </View>
  );
};