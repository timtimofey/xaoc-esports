// Pure JS database initializer
import { initStore } from "./store.js";

let initialized = false;

export function initDB() {
  if (!initialized) {
    initStore();
    initialized = true;
  }
  return { ok: true };
}

export function getDB() {
  return { ok: true };
}
