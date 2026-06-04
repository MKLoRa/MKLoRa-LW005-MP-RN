import RNToast, {ToastOptions} from 'react-native-root-toast';

const Toast = {
  show: (message: string, config?: ToastOptions) => {
    const conf: ToastOptions = {
      duration: 500,
      position: RNToast.positions.CENTER,
      shadow: false,
      animation: true,
      hideOnPress: true,
      delay: 0,
      ...config,
    };
    RNToast.show(message, conf);
  },
};

export default Toast;
