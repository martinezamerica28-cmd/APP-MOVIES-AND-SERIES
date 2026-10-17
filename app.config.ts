import config from './app.json';
export default () => ({
 ...config.expo,
 plugins: [
  'expo-apple-authentication',
  ['expo-image-picker', { photosPermission: 'Permite elegir una foto para tu perfil de Cineclub.', cameraPermission: false, microphonePermission: false }],
  ...(process.env.GOOGLE_IOS_URL_SCHEME ? [['@react-native-google-signin/google-signin', { iosUrlScheme: process.env.GOOGLE_IOS_URL_SCHEME }]] : []),
 ],
});
