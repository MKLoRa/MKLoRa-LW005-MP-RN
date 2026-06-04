import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useRef,
} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

type ScrollToInputFn = () => void;

const KeyboardScrollContext = createContext<ScrollToInputFn | null>(null);

export function useKeyboardScrollOnFocus(): ScrollToInputFn | undefined {
  return useContext(KeyboardScrollContext) ?? undefined;
}

/** 带键盘避让的表单 ScrollView，对齐 iOS MLInputDodger 行为 */
const KeyboardFormScrollView = forwardRef<ScrollView, ScrollViewProps>(
  ({style, contentContainerStyle, children, ...rest}, ref) => {
    const insets = useSafeAreaInsets();
    const scrollRef = useRef<ScrollView>(null);

    useImperativeHandle(ref, () => scrollRef.current as ScrollView);

    const scrollForKeyboard = useCallback(() => {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({animated: true});
      });
    }, []);

    const keyboardOffset = insets.top + 44;

    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardOffset}>
        <KeyboardScrollContext.Provider value={scrollForKeyboard}>
          <ScrollView
            ref={scrollRef}
            style={[styles.flex, style]}
            contentContainerStyle={[styles.content, contentContainerStyle]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            {...rest}>
            {children}
          </ScrollView>
        </KeyboardScrollContext.Provider>
      </KeyboardAvoidingView>
    );
  },
);

const styles = StyleSheet.create({
  flex: {flex: 1},
  content: {paddingBottom: 32},
});

export default KeyboardFormScrollView;
