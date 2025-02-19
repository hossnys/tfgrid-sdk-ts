<!-- eslint-disable vue/no-v-text-v-html-on-component -->
<template>
  <v-app>
    <v-app-bar :class="{ 'sidebar-opened': !mini, 'ml-4 ': !mini }" color="#064663" dense dark fixed height="65">
      <v-app-bar-nav-icon></v-app-bar-nav-icon>

      <v-toolbar-title class="font-weight-bold" @click="redirectToHomePage" style="cursor: pointer"
        >Threefold Chain</v-toolbar-title
      >

      <v-spacer>
        <div class="d-flex align-center justify-start">
          <TftSwapPrice v-if="!loadingAPI" />
          <FundsCard v-if="$store.state.credentials.initialized && $store.state.credentials.balance" />
        </div>
      </v-spacer>
      <div class="d-flex align-center">
        <div class="d-flex" style="align-items: center">
          <v-btn icon @click="toggle_dark_mode">
            <v-icon>mdi-theme-light-dark</v-icon>
          </v-btn>

          <TfChainConnector />
        </div>
      </div>
    </v-app-bar>

    <v-navigation-drawer
      app
      color="#333"
      class="white--text"
      permanent
      v-model="drawer"
      width="320"
      :mini-variant.sync="mini"
    >
      <v-list :style="{ paddingBottom: '75px' }">
        <v-list-item class="px-2">
          <v-list-item-avatar>
            <v-img src="./assets/logo.png"></v-img>
          </v-list-item-avatar>

          <v-list-item-title class="white--text" @click="redirectToHomePage" style="cursor: pointer"
            >Threefold Chain</v-list-item-title
          >

          <!-- Close Button -->
          <v-btn icon @click.stop="toggle()">
            <v-icon class="white--text">mdi-chevron-left</v-icon>
          </v-btn>
        </v-list-item>
        <v-divider></v-divider>
        <template v-for="route in routes">
          <v-list-item
            v-if="!route.children.length"
            :class="{ 'mr-2 ml-2': !mini }"
            :key="route.label"
            :to="route.hyperlink ? undefined : route.prefix"
            @click="route.hyperlink ? openLink(route.prefix) : undefined"
          >
            <v-list-item-icon>
              <v-icon class="white--text" v-text="'mdi-' + route.icon" />
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="white--text" :style="{ textOverflow: 'initial' }">
                <strong>
                  {{ route.label === "Legacy Playground" ? "Playground" : route.label }}
                </strong>
                <v-chip v-if="route.prefix.includes('play.')" class="ml-2" color="red" outlined small text-color="red">
                  Legacy
                </v-chip>
                <v-chip
                  v-if="route.prefix.includes('playground')"
                  class="ml-2 pulse-animation"
                  color="#1AA18F"
                  small
                  text-color="white"
                >
                  Experimental
                </v-chip>
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-group
            v-else
            :active="route.active"
            :key="'V-' + route.label"
            v-model="route.active"
            class="white--text"
            @click="onPortalActivateAccount(route)"
            :style="mini ? '' : 'margin: 10px !important;'"
          >
            <template v-slot:activator>
              <v-list-item-icon>
                <v-icon class="white--text" v-text="'mdi-' + route.icon" />
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title class="white--text">
                  <strong>
                    {{ route.label }}
                  </strong>
                </v-list-item-title>
              </v-list-item-content>
            </template>
            <div v-if="route.prefix === '/portal/'">
              <template v-if="!$store.state.credentials.initialized">
                <div class="mt-4">
                  <v-alert color="rgb(25, 130, 177)" dense type="info">
                    You should <strong>select/create</strong> an account to enable the portal functionalities.
                  </v-alert>
                </div>
              </template>
              <template v-else>
                <div v-for="account in filteredAccounts()" :key="account.address">
                  <v-list-item
                    :active="account.active"
                    v-for="subchild in route.children"
                    :key="subchild.label"
                    :to="route.prefix + subchild.path"
                    class="white--text pl-16"
                  >
                    <v-list-item-icon>
                      <v-icon class="white--text" v-text="'mdi-' + subchild.icon" />
                    </v-list-item-icon>
                    <v-list-item-content>
                      <v-list-item-title class="white--text text-capitalize" v-text="subchild.label">
                      </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </div>
              </template>
            </div>
            <div v-else>
              <v-list-item
                active
                v-for="child in route.children"
                :key="child.label"
                :to="route.prefix + child.path"
                class="pl-16"
              >
                <v-list-item-icon class="mr-4" v-if="child.icon">
                  <v-icon class="white--text" v-text="'mdi-' + child.icon" />
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title class="white--text" v-text="child.label"> </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </div>
          </v-list-group>
        </template>
      </v-list>
      <div
        :style="
          mini
            ? 'display: none'
            : 'position: fixed; bottom: 2%; right: 7%; background-color: rgb(25, 130, 177); padding: 5px 10px; border-radius: 15px;'
        "
      >
        <span>{{ version ? version : "no version provided" }}</span>
      </div>
    </v-navigation-drawer>

    <!-- <div :style="'padding-left:' + (mini ? '56px' : '300px')">
      <router-view />
    </div> -->

    <v-content class="mt-15">
      <v-container fluid>
        <v-row class="fill-height">
          <v-col>
            <transition name="fade">
              <router-view></router-view>
            </transition>
          </v-col>
        </v-row>
      </v-container>
    </v-content>

    <v-footer padless fixed>
      <v-card class="flex" flat tile>
        <v-card-text class="py-2 text-center">
          {{ new Date().getFullYear() }} — <strong>ThreeFoldTech</strong>
        </v-card-text>
      </v-card>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

import config from "@/portal/config";

import TfChainConnector from "./components/TfChainConnector.vue";
import FundsCard from "./portal/components/FundsCard.vue";
import TftSwapPrice from "./portal/components/TftSwapPrice.vue";
import { connect } from "./portal/lib/connect";

interface SidenavItem {
  label: string;
  icon: string;
  prefix: string;
  active?: boolean;
  hidden?: boolean;
  hyperlink?: boolean;
  children: Array<{
    label?: string;
    path?: string;
    icon: string;
    active?: boolean;
    showBeforeLogIn: boolean; //i.e loginto the polkadot.js
    children?:
      | Array<{
          label: string;
          path?: string;
          icon: string;
        }>
      | [];
  }>;
}

@Component({
  name: "Dashboard",
  components: { FundsCard, TftSwapPrice, TfChainConnector },
})
export default class Dashboard extends Vue {
  collapseOnScroll = true;
  mini = true;
  drawer = true;
  $api: any;
  loadingAPI = true;
  version = config.version;

  async mounted() {
    this.routes = this.routes.filter(route => !route.hidden);
    Vue.prototype.$api = await connect();
    this.$store.commit("portal/setApi", { api: this.$api });
    this.loadingAPI = false;

    const theme = localStorage.getItem("dark_theme");
    if (theme) {
      if (theme === "true") {
        this.$vuetify.theme.dark = true;
      } else {
        this.$vuetify.theme.dark = false;
      }
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      this.$vuetify.theme.dark = true;
      localStorage.setItem("dark_theme", this.$vuetify.theme.dark.toString());
    }

    this.$root.$on("selectAccount", async () => {
      // On selecting an account, should we view the twin details view.
      this.routes[0].active = true;
      this.mini = false;
    });

    this.$root.$on("closeSidebar", () => {
      this.mini = !this.mini;
      if (this.mini) {
        const [portal, explorer, calculator] = this.routes;
        portal.active = false;
        explorer.active = false;
        calculator.active = false;
      }
    });
  }

  openLink(url: string): void {
    window.open(url, "_blank");
  }

  onPortalActivateAccount(route: SidenavItem): void | undefined {
    if (this.$route.name !== "accounts" && !this.filteredAccounts().length && route.label === "Portal") {
      return this.redirectToHomePage();
    }
  }

  async unmounted() {
    await this.$api.disconnect();
    this.$store.dispatch("portal/unsubscribeAccounts");
    this.$store.commit("UNSET_CREDENTIALS");
    this.$router.push({
      name: "accounts",
      path: `/`,
    });
  }

  public filteredAccounts() {
    return [this.$store.state.credentials.account];
  }

  public isAccountSelected() {
    if (this.$store.state.credentials.initialized) {
      return true;
    }
    return false;
  }

  public disconnectWallet() {
    this.$store.dispatch("portal/unsubscribeAccounts");
    if (this.$store.state.credentials.initialized) {
      this.$store.commit("UNSET_CREDENTIALS");
      this.$router.push({
        name: "accounts",
        path: `/`,
      });
    }
  }

  public redirectToHomePage() {
    if (this.$route.path !== "/") {
      this.$router.push({
        name: "accounts",
        path: "/",
      });
    }
  }

  public toggle_dark_mode() {
    this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
    localStorage.setItem("dark_theme", this.$vuetify.theme.dark.toString());
  }

  routes: SidenavItem[] = [
    {
      //label and path will be retrieved from accounts fetched from store (polkadot)
      label: "Portal",
      icon: "account-convert-outline",
      prefix: "/portal/",
      active: this.mini ? false : true,
      children: [
        {
          label: "twin",
          path: "account-twin",
          icon: "account-supervisor-outline",
          showBeforeLogIn: false,
        },
        {
          label: "bridge",
          path: "account-swap",
          icon: "swap-horizontal",
          showBeforeLogIn: false,
        },
        {
          label: "transfer",
          path: "account-transfer",
          icon: "account-arrow-right-outline",
          showBeforeLogIn: false,
        },
        {
          label: "farms",
          path: "account-farms",
          icon: "silo",
          showBeforeLogIn: false,
        },
        {
          label: "dedicated nodes",
          path: "account-nodes",
          icon: "resistor-nodes",
          showBeforeLogIn: false,
        },
        {
          label: "dao",
          path: "account-dao",
          icon: "note-check-outline",
          showBeforeLogIn: false,
        },
      ],
    },
    {
      label: "Explorer",
      icon: "database-search-outline",
      prefix: "/explorer/",
      active: this.mini ? false : true,
      children: [
        {
          label: "Statistics",
          path: "statistics",
          icon: "chart-scatter-plot",
          showBeforeLogIn: true,
        },
        {
          label: "Nodes",
          path: "nodes",
          icon: "access-point",
          showBeforeLogIn: true,
        },
        {
          label: "Farms",
          path: "farms",
          icon: "lan-connect",
          showBeforeLogIn: true,
        },
      ],
    },
    {
      label: "Calculators",
      icon: "calculator",
      prefix: "/calculator/",
      active: this.mini ? false : true,
      children: [
        {
          label: "Resource Pricing",
          path: "calculator",
          icon: "currency-usd",
          showBeforeLogIn: true,
        },
        {
          label: "Simulator",
          path: "simulator",
          icon: "chart-line",
          showBeforeLogIn: false,
          children: [
            {
              label: "Farming",
              path: "farm",
              icon: "lan-connect",
            },
          ],
        },
      ],
    },
    {
      label: "Zero-Os Bootstrap",
      icon: "earth",
      prefix: "/other/bootstrap",
      children: [],
    },
    {
      label: "Minting",
      icon: "cash-multiple",
      prefix: "/other/minting",
      children: [],
      hidden: window.configs.APP_NETWORK !== "main",
    },
    {
      label: "Monitoring",
      icon: "equalizer",
      prefix: "https://metrics.grid.tf",
      hyperlink: true,
      children: [],
    },
    {
      label: "0-Hub",
      icon: "open-in-new",
      prefix: "https://hub.grid.tf/",
      hyperlink: true,
      children: [],
    },
    {
      label: "Playground",
      icon: "open-in-new",
      prefix: window.configs.PLAYGROUND_V2_URL,
      hyperlink: true,
      children: [],
    },
    {
      label: "Manual",
      icon: "book-open-page-variant-outline",
      prefix: window.configs.MANUAL_URL,
      hyperlink: true,
      children: [],
    },
    {
      label: "Legacy Playground",
      icon: "open-in-new",
      prefix: window.configs.PLAYGROUND_URL,
      hyperlink: true,
      children: [],
    },
  ];

  toggle() {
    this.$root.$emit("closeSidebar");
  }
}
</script>

<style>
@import "./assets/css/styles.css";

#app {
  background-color: var(--v-background-base);
}

.v-navigation-drawer {
  background-color: #333;
}

.loadingDialog {
  overflow: hidden;
}

.v-list-item__icon .theme--light.fa-chevron-down,
.v-list-item__icon .theme--light.fa-caret-down,
.v-list-item__icon .theme--light.fa-chevron-up,
.v-list-item__icon .theme--light.fa-caret-up {
  color: white !important;
}

.v-list .v-list-item--link:hover,
.v-list-item--link:before {
  background-color: #1982b1 !important;
  color: white !important;
  border-radius: 20px;
}

.v-list .v-list-item--active {
  border-radius: 20px;
}

.theme--dark.v-card > .v-card__text,
.theme--dark.v-card > .v-card__subtitle {
  color: rgb(255, 255, 255);
}

.theme--light.v-card > .v-card__text,
.theme--light.v-card > .v-card__subtitle {
  color: rgb(0, 0, 0);
}

.theme--light.v-btn.v-btn--icon {
  color: rgba(0, 0, 0);
}

.sidebar-opened {
  left: 5rem !important;
}

@keyframes shake {
  0% {
    transform: translateX(0);
  }

  9.375% {
    transform: translateX(-2px);
  }

  18.75% {
    transform: translateX(2px);
  }

  28.125% {
    transform: translateX(-2px);
  }

  37.5%,
  100% {
    transform: translateX(0);
  }
}

.pulse-animation {
  animation: shake 3.2s ease infinite;
}
</style>
