// Browser-side auth helpers. The actual JWT cookie is httpOnly so we
// never see it from JS — the api owns it. We just call /auth/* and
// trust the cookie travels with `credentials: "include"`.

import { apiClient } from "./api-client.js";
import type { Login, Signup } from "@looper/shared";
import type { PublicUser } from "@looper/shared";

export const authClient = {
  signup: (input: Signup) => apiClient.post<{ user: PublicUser }>("/auth/signup", input),
  login: (input: Login) => apiClient.post<{ user: PublicUser }>("/auth/login", input),
  logout: () => apiClient.post<void>("/auth/logout"),
  me: () => apiClient.get<{ user: PublicUser }>("/auth/me"),
};
