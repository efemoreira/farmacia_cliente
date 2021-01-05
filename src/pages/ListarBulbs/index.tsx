import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PermissionsAndroid,
  Platform,
  NativeEventEmitter,
  Alert,
  DeviceEventEmitter,
} from 'react-native';

import Kontakt, { KontaktModule } from 'react-native-kontaktio';
import NotificationPopup from 'react-native-push-notification-popup';
import AsyncStorage from '@react-native-community/async-storage';
import { AxiosResponse } from 'axios';
import { useAuth } from '../../hooks/auth';
import api from '../../services/api';

const { connect, init, startDiscovery, startScanning } = Kontakt;
const kontaktEmitter = new NativeEventEmitter(KontaktModule);

const isAndroid = Platform.OS === 'android';

type Beacon = {
  accuracy: number;
  rssi: number;
  name: string;
  address: string;
};

type ListBeacons = {
  id: string;
  nome: string;
  mac: string;
  tipo: string;
  start: number;
  end: number;
};

type BulbUser = {
  name: string;
  email: string;
};

type ListReceivedPush = {
  count: number;
  mac: string;
};

const ListBulbs: React.FC = () => {
  const refNotify = useRef<NotificationPopup>(null);
  const [beacon, setBeacons] = useState<Beacon[]>([]);
  const [bulbUser, setBulbUser] = useState<BulbUser | null>(null);
  const [listBeacons, setListBeacons] = useState<ListBeacons[]>([]);
  const [listReceivedPush, setListReceivedPush] = useState<ListReceivedPush[]>(
    [],
  );

  const [duration, setDuration] = useState(1000);

  const { user } = useAuth();
  const readBeacons = async () => {
    console.log('Read');
    if (isAndroid) {
      const granted = await requestLocationPermission();
      if (granted) {
        await connect();
        await startScanning();
      } else {
        Alert.alert(
          'Permissão negada!',
          'Precisamos de sua permissão para acessar o aplicativo via bluetooth.',
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
        async ({ beacons, region }) => {
          setBeacons(beacons);
          if (!beacons?.length) {
            await AsyncStorage.setItem('macs', JSON.stringify([]));
          }
        },
      );
    } else {
      kontaktEmitter.addListener('didDiscoverDevices', async ({ beacons }) => {
        setBeacons(beacons);
        if (!beacons?.length) {
          await AsyncStorage.setItem('macs', JSON.stringify([]));
        }
      });
    }
  };

  const getBulbUser = async () => {
    const user = await AsyncStorage.getItem('@bulb:bulbUser');
    const userBulb: BulbUser = JSON.parse(`${user}`);
    setBulbUser(userBulb);
  };

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
      console.warn(err);
      return false;
    }
  };

  const chekingUser = useCallback(async () => {
    console.log('aqui');
    const userId = user.id;

    try {
      const response = await api.post('userarrived', {
        user_id: userId,
      });
    } catch (error) {
      console.log(error);
    }
  }, []);

  const getBeacons = useCallback(async () => {
    try {
      const response = await api.get<ListBeacons[]>('/beacons');

      setListBeacons(response.data);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const debounceEvent = (
    fn: Promise<AxiosResponse<any>>,
    wait = 1000,
    time: NodeJS.Timeout,
  ) => (search: string) => {
    clearTimeout(time);
    // eslint-disable-next-line no-param-reassign
    time = setTimeout(() => fn(search), wait);
  };

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const onPush = async (
    desciption: string,
    macBulb: string,
    entrada: boolean | null,
  ) => {
    const macsJson = await AsyncStorage.getItem('macs');

    const macs: string[] = JSON.parse(`${macsJson}`);

    const result = macs?.filter((item) => item === macBulb);

    if (!result?.length) {
      console.log('result');

      const spread = macs || [];
      await AsyncStorage.setItem('macs', JSON.stringify([...spread, macBulb]));

      entrada && chekingUser(macBulb);

      const en = desciption;

      const id = await AsyncStorage.getItem('@bulb:idOneSignal');

      api.post('https://onesignal.com/api/v1/notifications', {
        app_id: '58654a00-baf1-47a8-808b-c2d01a717525',
        contents: {
          en,
        },
        include_player_ids: [id],
      });

      return (
        refNotify.current &&
        refNotify.current.show({
          onPress() {
            console.log('Pressed');
          },
          title: 'App Farmácia',
          body: desciption,
          slideOutTime: 5000,
        })
      );
    }
  };

  const roulesSendPush = (item: Beacon) => {
    console.log('item');
    console.log(item.address);

    listBeacons.map((beacon) => {
      if (
        beacon.mac == item.address &&
        item.rssi >= beacon.start &&
        item.rssi <= beacon.end
      ) {
        if (beacon.tipo == 'ENTRADA') {
          if (beacon.mac == item.address) {
            return onPush(`Seja bem vindo ${user.name}.😀`, beacon.mac, true);
          }
        }
        if (beacon.tipo == 'DIRERRADA') {
          return onPush(
            `${user.name}, você esta na direção errada. 😞`,
            beacon.mac,
          );
        }
        if (beacon.tipo == 'SALACORRETA') {
          return onPush(
            `${user.name}, você chegou no seu destino erro 😀😀.`,
            beacon.mac,
          );
        }
      }
    });
  };

  useEffect(() => {
    async function bootsTrap(): Promise<void> {
      await getBeacons();
      await getBulbUser();
      await readBeacons();
    }
    bootsTrap();

  }, [beacon]);

  return (
    <>
      {beacon.map((item) => {
        bulbUser && roulesSendPush(item);
      })}
      <NotificationPopup ref={refNotify} />
    </>
  );
};

export default ListBulbs;
