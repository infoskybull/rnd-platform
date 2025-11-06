import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import walletReducer from "./walletSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    wallet: walletReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        ignoredPaths: ["register"],
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
