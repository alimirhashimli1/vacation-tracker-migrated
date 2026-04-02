import { configureStore } from '@reduxjs/toolkit';
import authReducer, { getInitialState } from './authSlice';

export const setupStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
        auth: {
            ...getInitialState(),
            ...preloadedState?.auth,
        },
    },
  });
};

export const store = setupStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = typeof store.dispatch;
