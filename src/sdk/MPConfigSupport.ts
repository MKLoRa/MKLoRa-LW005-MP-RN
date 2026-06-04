/**
 * MP config helpers — aligned with MKMPInterface+MKMPConfig.m
 */

import MPCentralManager, {type BleTaskChannel} from './MPCentralManager';
import {TaskOperationID} from './TaskOperationID';

export type SucBlock = () => void;
export type FailedBlock = (error: Error) => void;
type SdkResponse = {msg: string; code: string; result: unknown};

function central() {
  return MPCentralManager.shared();
}

function unwrapResult(data: SdkResponse): Record<string, unknown> | undefined {
  const result = data.result;
  if (result && typeof result === 'object') {
    return result as Record<string, unknown>;
  }
  return undefined;
}

export function paramsError(failed?: FailedBlock): void {
  failed?.(new Error('Invalid params'));
}

export function isConfigSuccess(result: Record<string, unknown>): boolean {
  const v = result.success;
  return v === true || v === 1 || v === '1';
}

function sendConfig(
  channel: BleTaskChannel,
  taskID: TaskOperationID,
  commandData: string,
  suc?: SucBlock,
  failed?: FailedBlock,
): void {
  central().addTaskWithTaskID(
    taskID,
    commandData,
    data => {
      const result = unwrapResult(data);
      if (!result || !isConfigSuccess(result)) {
        failed?.(new Error('Set params error'));
        return;
      }
      suc?.();
    },
    failed,
    channel,
  );
}

export function configData(
  taskID: TaskOperationID,
  commandData: string,
  suc?: SucBlock,
  failed?: FailedBlock,
): void {
  sendConfig('params', taskID, commandData, suc, failed);
}

export function configControl(
  taskID: TaskOperationID,
  commandData: string,
  suc?: SucBlock,
  failed?: FailedBlock,
): void {
  sendConfig('control', taskID, commandData, suc, failed);
}

export function configBool(
  taskID: TaskOperationID,
  isOn: boolean,
  onCmd: string,
  offCmd: string,
  suc?: SucBlock,
  failed?: FailedBlock,
): void {
  configData(taskID, isOn ? onCmd : offCmd, suc, failed);
}
