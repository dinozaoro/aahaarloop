import { globalIgnores } from "eslint/config";

export default globalIgnores([
  "node_modules/**",
  "dist/**",
  "coverage/**",
  ".turbo/**",
]);
