import { createApp } from "vue";
import App from "./App.vue";
import "./css/style.css";
import PrimeVue from "primevue/config";
import Tooltip from "primevue/tooltip";
import Aura from "@primeuix/themes/Aura";

const app = createApp(App);

app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      cssLayer: {
        name: "primevue",
        order: "theme, base, primevue",
      },
      prefix: "p",
      darkModeSelector: ".my-app-dark",
    },
  },
});

app.directive("tooltip", Tooltip);
app.mount("#app");
