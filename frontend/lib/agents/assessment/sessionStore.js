// Shared session store for assessment API routes
// In Next.js, route handlers in different files don't share module-level state,
// so we use a singleton pattern via globalThis

if (!globalThis.__assessmentSessions) {
  globalThis.__assessmentSessions = new Map();
}

const sessionStore = globalThis.__assessmentSessions;

export function getSession(id) {
  return sessionStore.get(id);
}

export function setSession(id, session) {
  sessionStore.set(id, session);
}

export function deleteSession(id) {
  sessionStore.delete(id);
}

export function getAllSessions() {
  return sessionStore;
}
