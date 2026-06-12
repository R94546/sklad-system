// Хранение выбранного вида «плитка/список» между сессиями
export const getSavedView = (key, fallback = "grid") => localStorage.getItem("view:" + key) || fallback;
export const saveView = (key, view) => localStorage.setItem("view:" + key, view);
