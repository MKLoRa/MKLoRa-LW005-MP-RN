import React, {useCallback, useState} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import TextFieldCell from '../components/cells/TextFieldCell';
import PickerButtonCell from '../components/cells/PickerButtonCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import OptionPickerModal from '../components/OptionPickerModal';
import {LedColorType, ProductModel} from '../sdk/MPSDKDefines';
import {
  readPowerIndicatorColor,
  configPowerIndicatorColor,
} from '../utils/generalApi';
import {
  LED_COLOR_TYPE_OPTIONS,
  SAVE_VALIDATION_MSG_GENERAL,
  filterDigits,
  ledColorShowsThresholdFields,
  normalizeLedColorType,
  type PowerIndicatorColorState,
} from '../utils/generalModel';
import {apiErrorMessage} from '../utils/mpApi';
import {showToast} from '../utils/toast';

const LED_FIELDS: {
  key: keyof Pick<
    PowerIndicatorColorState,
    'blue' | 'green' | 'yellow' | 'orange' | 'red' | 'purple'
  >;
  label: string;
}[] = [
  {key: 'blue', label: 'Measured power for blue LED(W)'},
  {key: 'green', label: 'Measured power for green LED(W)'},
  {key: 'yellow', label: 'Measured power for yellow LED(W)'},
  {key: 'orange', label: 'Measured power for orange LED(W)'},
  {key: 'red', label: 'Measured power for red LED(W)'},
  {key: 'purple', label: 'Measured power for purple LED(W)'},
];

const PowerIndicatorColorScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [state, setState] = useState<PowerIndicatorColorState>({
    colorType: LedColorType.TransitionDirectly,
    productModel: ProductModel.EuropeFrance,
    blue: '',
    green: '',
    yellow: '',
    orange: '',
    red: '',
    purple: '',
  });
  const [pickerOpen, setPickerOpen] = useState(false);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    setDataReady(false);
    try {
      const data = await readPowerIndicatorColor();
      if (!cancelled()) {
        setState(data);
        setDataReady(true);
      }
    } catch (e) {
      if (!cancelled()) {
        showToast(apiErrorMessage(e));
      }
    } finally {
      if (!cancelled()) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      readData(() => cancelled);
      return () => {
        cancelled = true;
      };
    }, [readData]),
  );

  const onSave = async () => {
    if (!dataReady) {
      return;
    }
    setSaving(true);
    try {
      await configPowerIndicatorColor(state);
      showToast('Success');
    } catch (e) {
      const msg = apiErrorMessage(e);
      if (msg === SAVE_VALIDATION_MSG_GENERAL) {
        Alert.alert('Error', msg);
      } else {
        showToast(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const showThresholds = ledColorShowsThresholdFields(state.colorType);

  return (
    <StackScreenLayout
      title="Power Indicator Color"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      saveDisabled={!dataReady || loading || saving}
      loading={loading || saving}
      loadingText={saving ? 'Config...' : 'Reading...'}>
      <KeyboardFormScrollView style={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.headerText}>
            Select power indicator with color when device is on
          </Text>
          <PickerButtonCell
            label=""
            value={
              LED_COLOR_TYPE_OPTIONS[normalizeLedColorType(state.colorType)] ??
              LED_COLOR_TYPE_OPTIONS[0]
            }
            onPress={() => setPickerOpen(true)}
          />
        </View>
        {showThresholds
          ? LED_FIELDS.map((field, index) => (
              <React.Fragment key={field.key}>
                {index === 0 ? <SectionSpacer /> : null}
                <View style={styles.group}>
                  <TextFieldCell
                    label={field.label}
                    value={state[field.key]}
                    maxLength={4}
                    keyboardType="number-pad"
                    onChangeText={t =>
                      setState(s => ({
                        ...s,
                        [field.key]: filterDigits(t, 4),
                      }))
                    }
                  />
                </View>
              </React.Fragment>
            ))
          : null}
      </KeyboardFormScrollView>
      {pickerOpen ? (
        <OptionPickerModal
          visible
          title="Power Indicator Color"
          options={[...LED_COLOR_TYPE_OPTIONS]}
          selectedIndex={normalizeLedColorType(state.colorType)}
          onSelect={idx => {
            setState(s => ({...s, colorType: normalizeLedColorType(idx)}));
            setPickerOpen(false);
          }}
          onDismiss={() => setPickerOpen(false)}
        />
      ) : null}
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  header: {
    backgroundColor: '#f2f2f2',
    paddingTop: 15,
    paddingBottom: 10,
  },
  headerText: {
    fontSize: 15,
    color: '#333',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  group: {backgroundColor: '#fff'},
});

export default PowerIndicatorColorScreen;
