import React, {useRef} from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

/** 与 iOS MKMPTimeSegmentedCell deleteButtonWidth 一致 */
export const SWIPE_DELETE_WIDTH = 75;

interface Props {
  children: React.ReactNode;
  /** 当前行是否处于「删除按钮已露出」状态 */
  open: boolean;
  /** 左滑即将展开：先收起其它行（对齐 mp_cellResetFrame） */
  onSwipeWillOpen: () => void;
  onOpen: () => void;
  onClose: () => void;
  onDelete: () => void;
}

/**
 * 对齐 iOS MKMPTimeSegmentedCell：
 * - 左滑露出右侧 Delete
 * - 右滑或点击 contentPanel（删除已露出时）收起
 * - 展开前由父级收起其它 cell，保证同时只有一个删除按钮
 */
const SwipeDeleteRow: React.FC<Props> = ({
  children,
  open,
  onSwipeWillOpen,
  onOpen,
  onClose,
  onDelete,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const dragOrigin = useRef(0);
  const resetOthersCalled = useRef(false);

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: open ? -SWIPE_DELETE_WIDTH : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [open, translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy * 1.2),
      onPanResponderGrant: () => {
        resetOthersCalled.current = false;
        translateX.stopAnimation(value => {
          dragOrigin.current = value;
        });
      },
      onPanResponderMove: (_, g) => {
        if (!resetOthersCalled.current && Math.abs(g.dx) > 12) {
          resetOthersCalled.current = true;
          onSwipeWillOpen();
        }
        const next = Math.max(
          -SWIPE_DELETE_WIDTH,
          Math.min(0, dragOrigin.current + g.dx),
        );
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const end = dragOrigin.current + g.dx;
        if (end <= -SWIPE_DELETE_WIDTH / 2 || g.vx < -0.35) {
          onSwipeWillOpen();
          onOpen();
        } else if (end >= SWIPE_DELETE_WIDTH / 4 || g.vx > 0.35) {
          onClose();
        } else if (open) {
          onOpen();
        } else {
          onClose();
        }
      },
    }),
  ).current;

  const handlePanelPress = () => {
    if (open) {
      onClose();
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.deleteBack} pointerEvents="box-none">
        <Pressable style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
      <Animated.View
        style={[styles.contentPanel, {transform: [{translateX}]}]}
        {...panResponder.panHandlers}>
        {children}
        {open ? (
          <Pressable
            style={styles.closeOverlay}
            onPress={handlePanelPress}
            accessibilityRole="button"
            accessibilityLabel="Close delete"
          />
        ) : null}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  deleteBack: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#fff',
  },
  deleteBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: SWIPE_DELETE_WIDTH,
    backgroundColor: '#e53935',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: '#fff',
    fontSize: 13,
  },
  contentPanel: {
    width: '100%',
    backgroundColor: '#fff',
  },
  closeOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
});

export default SwipeDeleteRow;
