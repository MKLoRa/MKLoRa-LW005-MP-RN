import React from 'react';
import {StatusBar} from 'react-native';
import {Provider} from 'react-redux';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {RootSiblingParent} from 'react-native-root-siblings';
import {LoadingProvider} from './src/components/Loading';
import {store} from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import {NAVBAR_COLOR} from './src/theme/colors';

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <RootSiblingParent>
        <SafeAreaProvider>
          <LoadingProvider>
            <StatusBar
              barStyle="light-content"
              backgroundColor={NAVBAR_COLOR}
              translucent={false}
            />
            <AppNavigator />
          </LoadingProvider>
        </SafeAreaProvider>
      </RootSiblingParent>
    </Provider>
  );
}

export default App;
