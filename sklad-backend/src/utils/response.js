export const success = (res, data, message = 'OK', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

export const error = (res, message = 'Xatolik', statusCode = 400) => {
  return res.status(statusCode).json({ success: false, message });
};
