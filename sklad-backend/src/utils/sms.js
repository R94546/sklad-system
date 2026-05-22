import 'dotenv/config';
import axios from 'axios';

let token = null;

const getToken = async () => {
  const res = await axios.post('https://notify.eskiz.uz/api/auth/login', {
    email: process.env.ESKIZ_EMAIL,
    password: process.env.ESKIZ_PASSWORD,
  });
  token = res.data.data.token;
  return token;
};

export const sendSms = async (phone, message) => {
  try {
    if (!token) await getToken();
    await axios.post('https://notify.eskiz.uz/api/message/sms/send', {
      mobile_phone: phone.replace('+', ''),
      message,
      from: '4546',
    }, {
      headers: { Authorization: 'Bearer ' + token },
    });
    console.log('SMS yuborildi:', phone);
  } catch (err) {
    console.error('SMS xatosi:', err.message);
  }
};
