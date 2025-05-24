<template>
  <div>
    <!-- Login form -->
    <div v-if="!isLoggedin" class="min-h-screen flex flex-col items-center justify-center px-4">
      <div class="max-w-md w-full">
        <div class="p-8 rounded-2xl dark:bg-slate-700 shadow">
          <h2 class="text-center text-2xl font-bold dark:text-white text-gray-800">{{ $t("login") }}</h2>
          <form @submit.prevent="login_by_app" class="mt-8 space-y-6">
            <v-text-field
              class="ctextfield"
              type="email"
              v-model="email"
              :label="$t('email')"
              required
            ></v-text-field>
            <v-text-field
              class="ctextfield"
              type="password"
              v-model="password"
              :label="$t('password')"
              required
            ></v-text-field>
            <v-btn type="submit" color="primary" block>{{ $t("login") }}</v-btn>
          </form>
        </div>
      </div>
    </div>

    <!-- Logged in view -->
    <div v-else class="w-full max-w-xl m-auto p-10">
      <h1 class="text-2xl font-bold mb-4">{{ $t("Account page") }}</h1>
      <h2 class="mb-6">{{ $t("welcome") }} {{ username }}!</h2>

      <v-switch
        class="ctextfield mb-6"
        v-model="animation_backgound"
        :label="$t('disable_animation_background')"
        @change="set_user_setting"
      ></v-switch>

      <v-btn color="error" @click="logout">{{ $t("logout") }}</v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, computed, onMounted } from "vue";
import { Account } from "appwrite";
import { appw, user } from "@/appwrite";
import { useLoadingStore } from "@/stores/loading";
import router from "@/router";

export default {
  name: "Login",
  setup() {
    const email = ref("");
    const password = ref("");
    const animation_backgound = ref(false);
    const username = ref("");
    const loadingStore = useLoadingStore();

    const isLoggedin = computed(() => loadingStore.userLoggedin);

    const checkLogin = async () => {
      try {
        const account = new Account(appw);
        const session = await account.get();
        loadingStore.setUserLoggedin(true);
        username.value = session.name || session.email;
        loadingStore.setuid(session.$id);
        getUserSettings();
      } catch {
        loadingStore.setUserLoggedin(false);
      }
    };

    const login_by_app = async () => {
      try {
        const response = await user.createEmailPasswordSession(email.value, password.value);
        loadingStore.setUserLoggedin(true);
        loadingStore.setuid(response.userId);
        username.value = response.email;
        getUserSettings();
        // Optional: redirect
        // router.push("/home");
      } catch (err) {
        console.error("Login failed", err);
        alert("Login failed: " + err.message);
      }
    };

    const logout = async () => {
      const account = new Account(appw);
      await account.deleteSession("current");
      loadingStore.setUserLoggedin(false);
      loadingStore.setuid("");
      router.push("/home");
    };

    const getUserSettings = async () => {
      // optional: implement Appwrite settings read from DB
      // for now we just simulate:
      animation_backgound.value = false;
      loadingStore.setAnimation(animation_backgound.value);
    };

    const set_user_setting = () => {
      loadingStore.setAnimation(animation_backgound.value);
      console.log("Animation background changed:", animation_backgound.value);
    };

    onMounted(() => {
      document.title = "Login";
      checkLogin();
    });

    return {
      email,
      password,
      login_by_app,
      logout,
      isLoggedin,
      animation_backgound,
      set_user_setting,
      username,
    };
  },
};
</script>

<style scoped>
.ctextfield {
  margin-bottom: 1rem;
}
</style>
