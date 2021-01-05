import axios from 'axios';

const baseURLFaker = axios.create({
  baseURL: 'https://bulb-api.azurewebsites.net/',
});

export const historicAdd = async (
  idUser: string,
  tipo: string,
  data: string,
) => {
  const his = {
    idUser,
    farmacia: tipo,
    data,
  };
  const res = await baseURLFaker.post('/historics', his);
  console.log(res);
};
