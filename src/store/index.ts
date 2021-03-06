import { configureStore } from "@reduxjs/toolkit";

import userReducer from "./reducers/userReducer";

const reducer = {
  user: userReducer
};

const store = configureStore({
  reducer,
  devTools: process.env.NODE_ENV !== "production"
});

export default store;

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
