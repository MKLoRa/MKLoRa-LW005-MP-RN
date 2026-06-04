import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {ScannedDeviceModel} from '../sdk/MPSDKDefines';

interface DeviceState {
  connectedDevice: ScannedDeviceModel | null;
  isScanning: boolean;
}

const initialState: DeviceState = {
  connectedDevice: null,
  isScanning: false,
};

const deviceSlice = createSlice({
  name: 'device',
  initialState,
  reducers: {
    setConnectedDevice(state, action: PayloadAction<ScannedDeviceModel | null>) {
      state.connectedDevice = action.payload;
    },
    setScanning(state, action: PayloadAction<boolean>) {
      state.isScanning = action.payload;
    },
  },
});

export const {setConnectedDevice, setScanning} = deviceSlice.actions;
export default deviceSlice.reducer;
