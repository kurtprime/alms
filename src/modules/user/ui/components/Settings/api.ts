"use client";

import {
  updateProfile as updateProfileAction,
  updateAvatar as updateAvatarAction,
  changePassword as changePasswordAction,
  initiate2FA as initiate2FAAction,
  verify2FA as verify2FAAction,
  disable2FA as disable2FAAction,
} from "./actions";
import { ProfileFormValues, PasswordFormValues } from "./schema";

export const settingsApi = {
  updateProfile: async (data: ProfileFormValues) => {
    return await updateProfileAction(data);
  },

  updateAvatar: async (url: string) => {
    return await updateAvatarAction(url);
  },

  changePassword: async (data: PasswordFormValues) => {
    return await changePasswordAction(data);
  },

  initiate2FA: async (password: string) => {
    return await initiate2FAAction(password);
  },

  verify2FA: async (code: string) => {
    return await verify2FAAction(code);
  },

  disable2FA: async (password: string) => {
    return await disable2FAAction(password);
  },
};
