import React from 'react';
import { View, Text, Button, Alert } from 'react-native';

// NOTIFICATION LOCAL TESTE
import NotificationPopup from 'react-native-push-notification-popup';

// NOTIFICATION LOCAL ERRO
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotification from 'react-native-push-notification';

class Notification extends React.Component {
  constructor(props) {
    super(props);
    this.popup = React.createRef();
  }

  componentDidMount() {
    console.log('componentDidMount');
    this.ShowPush();
  }

  ShowPush() {
    console.log('ShowPush');
    this.popup.show({
      onPress: function () {
        console.log('Pressed');
      },
      //appIconSource: require('./assets/icon.jpg'),
      //appTitle: 'Bulb',
      //timeText: 'Now',
      title: 'Bulb',
      body: 'Seja bem vindo Názio. 😀😀',
      slideOutTime: 4000,
    });
  }

  renderCustomPopup = () => {
    return (
      <View style={{ flex: 1 }}>
        <Text>Bulb</Text>
        <Text>Bem vindo...</Text>
        <Button
          title="Clique"
          onPress={() => console.log('Popup button onPress!')}
        />
      </View>
    );
  };

  render() {
    return (
      <View style={{ flex: 1 }}>
        <NotificationPopup
          ref={(ref) => (this.popup = ref)}
          // renderPopupContent={this.renderCustomPopup}
          // shouldChildHandleResponderStart={true}
          // shouldChildHandleResponderMove={true}
        />

        {/* <Button title="SEND PUSH" onPress={() => this.ShowPush()} /> */}
      </View>
    );
  }
}

export default Notification;
