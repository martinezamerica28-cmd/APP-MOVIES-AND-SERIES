import config from './app.json';
export default () => ({
 ...config.expo,
 plugins: [
  'expo-apple-authentication',
  ...(process.env.GOOGLE_IOS_URL_SCHEME ? [['@react-native-google-signin/google-signin', { iosUrlScheme: process.env.GOOGLE_IOS_URL_SCHEME }]] : []),
 ],
});
