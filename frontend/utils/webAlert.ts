import { Platform } from 'react-native';

/**
 * Cross-platform alert that works on both mobile and web
 */
export function showAlert(title: string, message?: string) {
  if (Platform.OS === 'web') {
    alert(`${title}${message ? '\n\n' + message : ''}`);
  } else {
    const Alert = require('react-native').Alert;
    Alert.alert(title, message);
  }
}

/**
 * Cross-platform confirmation dialog that works on both mobile and web
 */
export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) {
  if (Platform.OS === 'web') {
    const confirmed = confirm(`${title}\n\n${message}`);
    if (confirmed) {
      onConfirm();
    } else if (onCancel) {
      onCancel();
    }
  } else {
    const Alert = require('react-native').Alert;
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: onCancel },
        { text: 'OK', onPress: onConfirm }
      ]
    );
  }
}

