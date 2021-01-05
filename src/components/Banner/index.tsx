import React from 'react';
import AsyncStorage from '@react-native-community/async-storage';
import { Text, ScrollView, View, Image, Alert } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import moment from 'moment';

import axios from 'axios';
import api from '../../services/api';

const baseURLFaker = axios.create({
  baseURL: 'https://bulb-api.azurewebsites.net/',
});

// HORA MOMENT
const buscaHora = () => {
  var hora = moment().format('hh:mm:ss');

  return hora;
};

// DATA MOMENT
const buscaData = () => {
  var data = moment().format('YYYY/MM/DD');

  return data;
};

const Banner: React.FC = () => {
  const [produtos, setProdutos] = React.useState([]);

  const getProducts = async () => {
    try {
      const URL_PRODUTOS = 'https://bulb-api.azurewebsites.net/produtos';

      const resposta = await baseURLFaker.get('/produtos');

      setProdutos(resposta.data);
    } catch (error) {
      Alert.alert(
        'App Farmácia',
        'Erro ao buscar a lista de produtos!!',
        [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
        { cancelable: false },
      );
    }
  };

  React.useEffect(() => {
    getProducts();
  }, []);

  const ativarOferta = async (produto: string, preco: string, img: string) => {
    const URL_OFERTAS = 'https://bulb-api.azurewebsites.net/ofertas';

    try {
      const user = await AsyncStorage.getItem('@bulb:bulbUser');
      const userBulb = JSON.parse(`${user}`);
      const fotoUser = await AsyncStorage.getItem('avatar');

      const parseUser = JSON.parse(fotoUser);

      const data = buscaData();
      const hora = buscaHora();

      var obj = {
        usuario: parseUser.base64,
        cliente: userBulb.name,
        userId: userBulb.id,
        img: img,
        produto: produto,
        preco: preco,
        data: data + ' ' + hora,
      };

      const res = await baseURLFaker.post('/ofertas', obj);

      Alert.alert(
        'Bulb Farmácia',
        `Parabéns, você ativou a oferta ${produto}. Já estamos separando o seu pedido!! 😀😀`,
        [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
        { cancelable: false },
      );
    } catch (error) {
      console.log(`Error ativarOferta ${error}`);

      Alert.alert(
        'Bulb Farmácia',
        `Não conseguimos registrar seu pedido! Tente novamente. 😞😞`,
        [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
        { cancelable: false },
      );
    }
  };

  return (
    <>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <View
          style={{
            margin: 10,
            borderRadius: 10,
            borderColor: '#ccc8',
            borderWidth: 1,
          }}
        >
          <ScrollView>
            {produtos.map((item, index) => {
              return (
                <View key={index} style={{ flex: 1 }}>
                  <Text
                    style={{
                      margin: 10,
                      color: 'red',
                      textAlign: 'center',
                      fontSize: 25,
                      fontWeight: 'bold',
                    }}
                  >
                    {item.desconto}
                  </Text>
                  <Image
                    source={{ uri: item.img }}
                    style={{
                      width: 200,
                      height: 150,
                      alignSelf: 'center',
                      resizeMode: 'contain',
                    }}
                  />
                  <Text
                    style={{
                      margin: 10,
                      color: '#1d1d1d',
                      textAlign: 'left',
                      fontSize: 20,
                    }}
                  >
                    {item.desc}
                  </Text>
                  <Text
                    style={{
                      margin: 10,
                      textAlign: 'left',
                      fontSize: 30,
                      fontWeight: 'bold',
                    }}
                  >
                    {item.preco}
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      ativarOferta(item.desc, item.preco, item.img)
                    }
                    style={{ margin: 10, backgroundColor: '#337cc7' }}
                  >
                    <Text
                      style={{
                        margin: 10,
                        color: '#fff',
                        textAlign: 'center',
                        fontSize: 20,
                      }}
                    >
                      Ativar Oferta
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </>
  );
};

export default Banner;
