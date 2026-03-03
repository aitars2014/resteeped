// Stub for expo-speech-recognition when native module is unavailable (Expo Go)
module.exports = {
  ExpoSpeechRecognitionModule: null,
  useSpeechRecognitionEvent: () => {},
  ExpoWebSpeechRecognition: class {},
  ExpoWebSpeechGrammar: class {},
  ExpoWebSpeechGrammarList: class {},
};
