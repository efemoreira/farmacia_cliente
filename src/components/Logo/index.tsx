import React from 'react';
import { Image } from 'react-native';

import logoImg from '../../assets/bulb1.png';

const Logo = () => (
  <Image
    source={logoImg}
    style={{
      width: 250,
      resizeMode: 'contain',
      marginVertical: '-35%',
    }}
  />
);

export default Logo;
