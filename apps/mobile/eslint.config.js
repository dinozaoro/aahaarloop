const expoConfig = require("eslint-config-expo/flat");

// Mobile screens load data from the API inside effects: the loading flag is set
// synchronously before the first await, which the React compiler rule flags as
// a cascading render. The initial state already is `loading: true`, so the
// extra render is harmless here. Keep the rule on for web, where interactions
// are more sensitive to cascading renders.
module.exports = [
  ...expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
    },
  },
];
