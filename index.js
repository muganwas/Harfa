/**
 * @format
 */
import {AppRegistry, YellowBox} from 'react-native';
import App from './src/components/SplashScreen';
import {name as appName} from './app.json';


YellowBox.ignoreWarnings([
  'Warning: componentWillMount is deprecated',
  'Warning: componentWillUpdate is deprecated',
  'Warning: componentWillReceiveProps is deprecated',
  'Warning: componentWillMount is deprecated and will be removed in the next major version',
  'Warning: componentWillMount has been renamed, and is not recommended for use.',
  'Warning: componentWillReceiveProps has been renamed, and is not recommended for use.',
  'Module RCTImageLoader requires',
  'Setting a timer',
  'Accessing view manager configs directly off UIManager',
  'RCTRootView cancelTouches',
  'DatePickerIOS has been merged',
  'DatePickerAndroid has been merged',
  'VirtualizedLists should never be nested inside plain ScrollViews with the same orientation',
  'You should only render one navigator explicitly in your app, and other navigators should be rendered by including them in that navigator'
]);


AppRegistry.registerComponent(appName, () => App );
