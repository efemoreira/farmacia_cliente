import axios from 'axios';

const api = axios.create({
  //baseURL: 'http://mobs2processor.eastus2.cloudapp.azure.com:8090/',
  baseURL: 'http://52.167.50.175:3005',
});

export default api;
