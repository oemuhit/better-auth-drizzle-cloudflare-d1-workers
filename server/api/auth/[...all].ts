import { serverAuth } from "../../utils/auth"; // path to your auth file
export default defineEventHandler((event) => {
  const auth = serverAuth(event);

  return auth.handler(toWebRequest(event));
});
