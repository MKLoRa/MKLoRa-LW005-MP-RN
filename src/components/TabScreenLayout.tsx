import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  StatusBar,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import NavBackButton from './NavBackButton';
import ScreenLoadingOverlay from './ScreenLoadingOverlay';
import {NAVBAR_COLOR, NAVBAR_TINT} from '../theme/colors';

interface Props {
  title: string;
  onBack: () => void;
  onSave?: () => void;
  loading?: boolean;
  /** 保存/下发中为 true 时遮罩显示 Config... */
  saving?: boolean;
  loadingText?: string;
  backgroundColor?: string;
  children: React.ReactNode;
}

const TabScreenLayout: React.FC<Props> = ({
  title,
  onBack,
  onSave,
  loading,
  saving,
  loadingText = 'Reading...',
  backgroundColor = '#F2F2F2',
  children,
}) => {
  const insets = useSafeAreaInsets();
  const showOverlay = Boolean(loading) || Boolean(saving);
  const overlayText = saving
    ? loadingText !== 'Reading...'
      ? loadingText
      : 'Config...'
    : loadingText;

  return (
    <View style={[styles.root, {backgroundColor}]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={NAVBAR_COLOR}
        translucent={false}
      />
      <View style={[styles.headerWrap, {paddingTop: insets.top}]}>
        <View style={styles.navBar}>
          <NavBackButton onPress={onBack} />
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {onSave ? (
            <Pressable style={styles.sideBtn} onPress={onSave} hitSlop={10}>
              <Image
                source={require('../../assets/images/mp_slotSaveIcon.png')}
                style={styles.saveIcon}
              />
            </Pressable>
          ) : (
            <View style={styles.sideBtn} />
          )}
        </View>
      </View>

      <View style={styles.body}>
        {children}
        <ScreenLoadingOverlay visible={showOverlay} text={overlayText} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  headerWrap: {
    backgroundColor: NAVBAR_COLOR,
  },
  navBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NAVBAR_COLOR,
    paddingHorizontal: 8,
  },
  sideBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: NAVBAR_TINT,
    textAlign: 'center',
  },
  saveIcon: {width: 22, height: 22},
  body: {flex: 1},
});

export default TabScreenLayout;
