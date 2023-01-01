import axios, { AxiosInstance } from 'axios';

const isDev = process.env.NODE_ENV === 'development';

const urlApiNotifyService = isDev
  ? 'http://localhost:9000'
  : process.env.API_NOTIFY_SERVICE;

const clientNotify: AxiosInstance = axios.create({
  baseURL: urlApiNotifyService,
  headers: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
  },
});

export default clientNotify;
