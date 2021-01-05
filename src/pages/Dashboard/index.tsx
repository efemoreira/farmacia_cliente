import React, { useState, useEffect, useCallback } from 'react';
import Icon from 'react-native-vector-icons/Feather';

import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useAuth } from '../../hooks/auth';
import {
  Container,
  Header,
  HeaderTitle,
  UserName,
  ProfileButton,
  UserAvatar,
  ProvidersList,
  ProvidersListTitle,
  ProviderContainer,
  ProviderAvatar,
  ProviderInfo,
  ProviderName,
  ProviderMeta,
  ProviderMetaText,
} from './styles';
import { Image, ImageSourcePropType, Linking, Platform, Text, Vibration, View } from 'react-native';

import Banner from '../../components/Banner';
import { Avatar } from '../Profile/styles';
import AsyncStorage from '@react-native-community/async-storage';

export interface Provider {
  id: string;
  name: string;
  avatar_url: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [providers, setProviders] = useState<Provider[]>([]);

  const [active, setActive] = useState(false);
  const [avatar, setAvatar] = useState('');

  const getAvatar = async() => {
    try {
      const resposta = await AsyncStorage.getItem('avatar');

      setAvatar(JSON.parse(resposta))
    } catch (error) {
      console.log("Erro ao recuperar a foto do usuario.")
    }
  }

  useEffect(() => {

    getAvatar()

    setTimeout(() => {
      setActive(true)
    }, 1500)


  }, [avatar]);

  return (
    <Container>
      <Header>
        <HeaderTitle>
          Bem vindo, {'\n'}
          <UserName>{user.name}</UserName>
        </HeaderTitle>

        {/* <ProfileButton onPress={() => navigation.navigate('Profile')}>
          <UserAvatar source={{ uri: user.avatar_url }} />
        </ProfileButton> */}

      <ProfileButton onPress={() => navigation.navigate('Profile')}>
        {
            avatar != undefined ?
            <View style={{width: 100, height: 100, backgroundColor: "#ccc", justifyContent: 'center', borderRadius: 50}}>
              <Image
                  source={{uri: avatar.uri}}
                  style={{
                    height: 100,
                    width: 100,
                    borderRadius: 50,
                  }}
                />
            </View>
            :
            <View
              style={{
                width: 100,
                height: 100,
                backgroundColor: "#ccc",
                justifyContent: 'center',
                borderRadius: 50
              }}
            />
          }
        </ProfileButton>


      </Header>

      <ProvidersListTitle>Suas Ofertas</ProvidersListTitle>

      { active ? <Banner /> : <Text style={{textAlign: 'center', fontSize: 25, color: '#ccc'}}>Aguarde...</Text> }

    </Container>
  );
};

export default Dashboard;
