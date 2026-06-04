import MPInterface from '../sdk/MPInterface';
import {
  apiErrorMessage,
  readPromise,
  waitForBleIdle,
  waitForBleReady,
} from './mpApi';

type ReadFn = (
  suc?: (data: {result: Record<string, unknown>}) => void,
  failed?: (e: Error) => void,
) => void;

export type DeviceInfoState = {
  software: string;
  firmware: string;
  hardware: string;
  macAddress: string;
  productModel: string;
  manufacturer: string;
};

async function readStep(
  msg: string,
  fn: () => Promise<Record<string, unknown>>,
): Promise<Record<string, unknown>> {
  try {
    return await fn();
  } catch (e) {
    const detail = apiErrorMessage(e);
    throw new Error(detail === 'Operation failed' ? msg : `${msg}: ${detail}`);
  }
}

function strField(res: Record<string, unknown>, key: string): string {
  const v = res[key];
  return v != null ? String(v) : '';
}

/** 对齐 MKMPDeviceInfoModel readDataWithSucBlock 顺序 */
export async function readDeviceInfo(): Promise<DeviceInfoState> {
  await waitForBleIdle();
  if (!(await waitForBleReady())) {
    throw new Error('The current connection device is in disconnect');
  }

  const macRes = await readStep('Read mac address error', () =>
    readPromise(MPInterface.read_mac_address as ReadFn),
  );
  const modelRes = await readStep('Read device model error', () =>
    readPromise(MPInterface.read_device_model as ReadFn),
  );
  const softwareRes = await readStep('Read software error', () =>
    readPromise(MPInterface.read_software as ReadFn),
  );
  const hardwareRes = await readStep('Read hardware error', () =>
    readPromise(MPInterface.read_hardware as ReadFn),
  );
  const firmwareRes = await readStep('Read firmware error', () =>
    readPromise(MPInterface.read_firmware as ReadFn),
  );
  const manuRes = await readStep('Read manu error', () =>
    readPromise(MPInterface.read_manufacturer as ReadFn),
  );

  return {
    macAddress: strField(macRes, 'macAddress'),
    productModel: strField(modelRes, 'modeID'),
    software: strField(softwareRes, 'software'),
    hardware: strField(hardwareRes, 'hardware'),
    firmware: strField(firmwareRes, 'firmware'),
    manufacturer: strField(manuRes, 'manufacturer'),
  };
}
