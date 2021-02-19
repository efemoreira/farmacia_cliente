import React, { useState } from 'react';
import 'react-native-gesture-handler';
import OneSignal from 'react-native-onesignal';
import Kontakt, { KontaktModule } from 'react-native-kontaktio';
import {
  StyleSheet,
  Text,
  TouchableHighlight,
  Modal,
  View,
  StatusBar,
  PermissionsAndroid,
  Platform,
  NativeEventEmitter,
  Alert,
  DeviceEventEmitter,
  Linking,
  Vibration,
} from 'react-native';
import { AirbnbRating } from 'react-native-elements';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-community/async-storage';

import BackgroundJob from 'react-native-background-actions';
import moment from 'moment';

import axios from 'axios';
import AppProvider from './hooks';

import Routes from './routes';
import { historicAdd } from './utils/historicAdd';

const { connect, init, startDiscovery, startScanning, setBeaconRegions } = Kontakt;

const kontaktEmitter = new NativeEventEmitter(KontaktModule);

const isAndroid = Platform.OS === 'android';

const sleep = (time: any) =>
  new Promise((resolve) => setTimeout(() => resolve(), time));

let beaconsLength = 0;
let hrEntrada = '';

const baseURLFaker = axios.create({
  baseURL: 'https://bulb-api.azurewebsites.net/',
});

// EXECUÇÃO DA TAREFA
const taskRandom = async (taskData: any) => {
  // beaconSetup()
  if (Platform.OS === 'ios') {
    console.warn(
      'This task will not keep your app alive in the background by itself, use other library like react-native-track-player that use audio,',
      'geolocalization, etc. to keep your app alive in the background while you excute the JS from this library.',
    );
  }
  await new Promise(async (resolve) => {
    const { delay } = taskData;

    for (let i = 0; BackgroundJob.isRunning(); i++) {
      await BackgroundJob.updateNotification({
        taskDesc: `Abra o nosso app e confira nossas Ofertas! 😀😀`,
      });
      await sleep(delay);
    }
  });
};

// CONFIGURACAO DA NOTIFICAÇAO
const options = {
  taskName: 'Example',
  taskTitle: 'Promoção 😀',
  taskDesc: 'Abra o nosso app e confira nossas Ofertas! 😀😀',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#337cc7',
  linkingURI: 'yourSchemeHere://chat/jane',
  parameters: {
    delay: 1000,
  },
};

// LINK DO APP
function handleOpenURL(evt: any) {
  console.log(evt.url);
}

Linking.addEventListener('url', handleOpenURL);

const requestLocationPermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      {
        title: 'Permissão de localização',
        message:
          'Este aplicativo precisa acessar sua localização para usar bluetooth.',
        buttonNeutral: 'Mais tarde',
        buttonNegative: 'Cancelar',
        buttonPositive: 'OK',
      },
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    }
    return false;
  } catch (err) {
    console.log(err);
    return false;
  }
};

type ApiBeacons = {
  id: string;
  nome: string;
  mac: string;
  tipo: string;
  start: number;
  end: number;
};

type BulbUser = {
  id: string;
  name: string;
  email: string;
};

type ListReceivedPush = {
  count: number;
  mac: string;
  address: string;
  rssi: number;
};

// HORA MOMENT
const buscaHora = () => {
  const hora = moment().format('hh:mm:ss');

  return hora;
};

// DATA MOMENT
const buscaData = () => {
  const data = moment().format('YYYY/MM/DD');

  return data;
};

// DIFENRENCA ENTRADA E SAIDA
const calculate_duration = (start: string, end: string) => {
  const time = moment
    .utc(moment(end, 'HH:mm:ss').diff(moment(start, 'HH:mm:ss')))
    .format('HH:mm:ss');

  return time;
};

const onPush = async (
  desciption: (userBulb: BulbUser) => string,
  macBulb: string,
  entrada: boolean | null,
  SALACORRETA: boolean | null,
) => {
  const user = await AsyncStorage.getItem('@bulb:bulbUser');
  const userBulb: BulbUser = JSON.parse(`${user}`);
  if (!userBulb) {
    return;
  }
  const macsJson = await AsyncStorage.getItem('macs');

  const macs: string[] = JSON.parse(`${macsJson}`);

  const result = macs?.filter((item) => item === macBulb);
  if (!result?.length) {
    Vibration.vibrate(700);
    Alert.alert(
      'Bulb Farmácia',
      desciption(userBulb),
      [
        {
          text: 'OK',
          onPress: () => {
            console.log('OK Pressed');
          },
        },
      ],
      { cancelable: false },
    );

    const spread = macs || [];
    await AsyncStorage.setItem('macs', JSON.stringify([...spread, macBulb]));

    entrada;
  }
};

const chekingUser = async (nome:string) => {
  try {
    if ((await AsyncStorage.getItem('@bulb:insideUser')) == null) {
      const user = await AsyncStorage.getItem('@bulb:bulbUser');
      const userBulb: BulbUser = JSON.parse(`${user}`);
      const userId = userBulb.id;
      const fotoUser = await AsyncStorage.getItem('avatar');

      const parseUser = JSON.parse(fotoUser);

      const cliente = {
        usuario: parseUser.base64,
        cliente: userBulb.name,
        userId: userBulb.id,
        data: hrEntrada,
      };

      const response = await baseURLFaker.post('/userarrived', cliente);
      historicAdd(userBulb.id, nome, hrEntrada);
      const { id } = response.data;
      await AsyncStorage.setItem('@bulb:insideUser', JSON.stringify(id));
    }
  } catch (error) {
    console.log(error);
  }
};

// REGISTRA SAIDA DO USUARIO
const exitUser = async () => {
  const hrSaida = buscaHora();
  const dataSaida = buscaData();

  const saida = `${dataSaida} ${hrSaida}`;

  try {
    const insideUser = await AsyncStorage.getItem('@bulb:insideUser');

    const user = await AsyncStorage.getItem('@bulb:bulbUser');
    const userBulb: BulbUser = JSON.parse(`${user}`);
    const userId = userBulb.id;

    const hrEnt = hrEntrada.split(' ')[1];

    const duracao = calculate_duration(hrEnt, hrSaida);

    const obj = {
      usuario: userBulb.name,
      entrada: hrEntrada,
      saida,
      duracao,
    };

    const res = await baseURLFaker.post('/exitUser', obj);
    await baseURLFaker.delete(`/userarrived/${insideUser}`);
    await AsyncStorage.removeItem('@bulb:insideUser');
  } catch (error) {
    console.log('exitUser error ', error);
  }
};

// REGISTRA A ULTIMA VEZ QM QUE O CLIENTE VISITOU O GRUPO
const visitarGrupo = async (data: string, user: string, avaliacao: string) => {
  const obj = {
    data,
    user,
    avaliacao,
  };
  await baseURLFaker.post('/hisGrupoFarm', obj);
};

const App: React.FC = () => {
  const [modalAvaliacaoVisibility, setmodalAvaliacaoVisibility] = useState(
    false,
  );
  const [avaliacao, setAvaliacao] = useState(0);

  const beaconSetup = async () => {
    try {
      const response = await baseURLFaker.get('/bulbs');

      await AsyncStorage.setItem(
        '@bulb:Apibeacons',
        JSON.stringify(response.data),
      );
    } catch (error) {
      console.log('beaconSetup error', error);
    }

    if (isAndroid) {
      const granted = await requestLocationPermission();
      if (granted) {
        await connect().then(() => setBeaconRegions([{uuid: '51677514-6788-8776-6688-655566888888'}]));
        await startScanning();
      } else {
        Alert.alert(
          'Permission error',
          'Location permission not granted. Cannot scan for beacons',
          [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
          { cancelable: false },
        );
      }
    } else {
      await init();
      await startDiscovery();
    }

    if (isAndroid) {
      DeviceEventEmitter.addListener(
        'beaconsDidUpdate',
        async ({ beacons }) => {
          try {
            const apiBeaconsAsyncStorage = await AsyncStorage.getItem(
              '@bulb:Apibeacons',
            );

            const apiBeacons: ApiBeacons[] =
              JSON.parse(`${apiBeaconsAsyncStorage}`) || [];

            if (beacons?.length) {
              beacons.map((item: ListReceivedPush) => {
                apiBeacons?.map(async (beacon) => {
                  console.log('item', item);
                  if (
                    beacon.mac === item.address &&
                    beacon.start * -1 >= item.rssi * -1 &&
                    beacon.end * -1 <= item.rssi * -1
                  ) {
                    if (beacon.tipo === 'ENTRADA') {
                      const hora = buscaHora();
                      const data = buscaData();
                      const dataFormatada = `${data} ${hora}`;

                      const user = await AsyncStorage.getItem('@bulb:bulbUser');
                      const userBulb: BulbUser = JSON.parse(`${user}`);

                      await BackgroundJob.start(taskRandom, options);

                      hrEntrada = dataFormatada;

                      chekingUser(beacon.nome);

                      return onPush(
                        (userBulb: BulbUser) =>
                          `Seja bem vindo ${`${userBulb?.name}` || ''}.😀`,
                        beacon.mac,
                        false,
                        false,
                      );
                    }
                  }
                });
              });
            } else {
              await AsyncStorage.removeItem('macs');
            }
          } catch (error) {
            console.log('DeviceEventEmitter error ', error);
          }

          beaconsLength = beacons.length;

          return beaconsLength;
        },
      );
    } else {
      kontaktEmitter.addListener('didDiscoverDevices', ({ beacons }) => {
        console.log('didDiscoverDevices', beacons);
      });
    }

    kontaktEmitter.addListener(
      'beaconDidDisappear',
      async ({ beacon }: { beacon: ListReceivedPush }) => {
        const macJson = await AsyncStorage.getItem('macs');
        const macs: string[] = JSON.parse(`${macJson}`);
        const newMacs = [...macs].filter((mac) => beacon.address !== mac);
        await AsyncStorage.setItem('macs', JSON.stringify(newMacs));

        try {
          const response = await baseURLFaker.get('/bulbs');

          response.data.map((item: any) => {
            if (item.mac === beacon.address && item.tipo === 'ENTRADA') {
              Vibration.vibrate(700);
              setmodalAvaliacaoVisibility(true);
              exitUser();
            }
          });
        } catch (error) {
          console.log('Avaliacao error ', error);
        }
      },
    );
  };

  let playing = BackgroundJob.isRunning();

  const toggleBackground = async () => {
    playing = !playing;
    if (playing) {
      try {
        console.log('Trying to start background service');
        await beaconSetup();
        console.log('Successful start!');
      } catch (e) {
        console.log('toggleBackground Error', e);
      }
    } else {
      console.log('Stop background service');
      await BackgroundJob.stop();
    }
  };

  const ratingCompleted = (rating) => {
    setAvaliacao(rating);
  };

  async function onIds(device: { userId: string }): Promise<void> {
    await AsyncStorage.setItem('@bulb:idOneSignal', device.userId);
  }

  React.useEffect(() => {
    OneSignal.init('58654a00-baf1-47a8-808b-c2d01a717525');

    OneSignal.addEventListener('ids', onIds);
    OneSignal.inFocusDisplaying(2);

    toggleBackground();

    return () => {
      OneSignal.removeEventListener('ids', onIds);
    };
  }, []);

  return (
    <NavigationContainer>
      <Modal
        animationType="slide"
        transparent
        visible={modalAvaliacaoVisibility}
        onRequestClose={() => {
          Alert.alert('Modal has been closed.');
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Avaliação</Text>

            <AirbnbRating
              count={5}
              reviews={['Pessimo', 'Ruim', 'OK', 'Bom', 'Perfeito']}
              defaultRating={5}
              size={40}
              onFinishRating={ratingCompleted}
            />

            <TouchableHighlight
              style={{ ...styles.openButton, backgroundColor: '#2196F3' }}
              onPress={async () => {
                setmodalAvaliacaoVisibility(!modalAvaliacaoVisibility);
                const user = await AsyncStorage.getItem('@bulb:bulbUser');
                const userBulb: BulbUser = JSON.parse(`${user}`);

                visitarGrupo(hrEntrada, userBulb.name, avaliacao);

                await AsyncStorage.removeItem('macs');
              }}
            >
              <Text style={styles.textStyle}>Enviar</Text>
            </TouchableHighlight>
          </View>
        </View>
      </Modal>
      <StatusBar barStyle="light-content" backgroundColor="#337cc7" />
      <AppProvider>
        <View style={{ flex: 1, backgroundColor: '#337cc7' }}>
          <Routes />
        </View>
      </AppProvider>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  openButton: {
    marginTop: 12,
    backgroundColor: '#F194FF',
    borderRadius: 20,
    padding: 10,
    paddingLeft: 18,
    paddingRight: 18,
    elevation: 2,
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 4,
    textAlign: 'center',
    fontSize: 32,
    color: '#337cc7',
    fontWeight: 'bold',
  },
});

export default App;
