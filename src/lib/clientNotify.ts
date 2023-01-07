import axios, { AxiosInstance } from "axios";

const clientNotify: AxiosInstance = axios.create({
  baseURL: process.env.API_NOTIFY_SERVICE,
  headers: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
  },
});

export default clientNotify;
