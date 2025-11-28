import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RepoFormat } from "../types";

interface UploadPayload {
  fileKey?: string;
  uploadUrl?: string;
  repoFormat?: RepoFormat;
  detectedFormat?: RepoFormat;
  files?: File[];
  compressedFile?: File;
  uploadStatus?: "idle" | "uploading" | "success" | "failed";
  error?: string;
}

interface UploadState {
  payload: UploadPayload | null;
}

const initialState: UploadState = {
  payload: null,
};

const uploadSlice = createSlice({
  name: "upload",
  initialState,
  reducers: {
    setUploadPayload: (state, action: PayloadAction<UploadPayload>) => {
      state.payload = action.payload;
    },
    updateUploadPayload: (state, action: PayloadAction<Partial<UploadPayload>>) => {
      if (state.payload) {
        state.payload = { ...state.payload, ...action.payload };
      } else {
        state.payload = action.payload as UploadPayload;
      }
    },
    setUploadStatus: (
      state,
      action: PayloadAction<{
        status: "idle" | "uploading" | "success" | "failed";
        error?: string;
      }>
    ) => {
      if (state.payload) {
        state.payload.uploadStatus = action.payload.status;
        if (action.payload.error) {
          state.payload.error = action.payload.error;
        }
      }
    },
    clearUploadPayload: (state) => {
      state.payload = null;
    },
  },
});

export const {
  setUploadPayload,
  updateUploadPayload,
  setUploadStatus,
  clearUploadPayload,
} = uploadSlice.actions;

export default uploadSlice.reducer;

