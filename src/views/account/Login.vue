<template>
  <div>
    <!-- Login form -->
    <div v-if="!isLoggedin" class="min-h-screen flex flex-col items-center justify-center px-4">
      <div class="max-w-md w-full">
        <div class="p-8 rounded-2xl dark:bg-slate-700 bg-white shadow-lg">
          <h2 class="text-center text-2xl font-bold dark:text-white text-gray-800 mb-2">{{ $t("login") }}</h2>
          <p class="text-center text-gray-600 dark:text-gray-300 text-sm mb-8">{{ $t("welcome_back") || "Jelentkezz be a fiókodba" }}</p>

          <!-- Error message -->
          <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm">
            <i class="pi pi-exclamation-triangle mr-2"></i>
            {{ errorMessage }}
          </div>

          <form @submit.prevent="login_by_app" class="space-y-4">
            <v-text-field
              class="ctextfield"
              type="email"
              v-model="email"
              :label="$t('email')"
              :disabled="isLoading"
              required
            ></v-text-field>
            <v-text-field
              class="ctextfield"
              type="password"
              v-model="password"
              :label="$t('password')"
              :disabled="isLoading"
              required
            ></v-text-field>
            <v-btn
              type="submit"
              color="primary"
              block
              :loading="isLoading"
              :disabled="isLoading"
            >
              {{ isLoading ? $t("logging_in") || "Bejelentkezés..." : $t("login") }}
            </v-btn>
          </form>
        </div>
      </div>
    </div>

    <!-- Logged in view -->
    <div v-else class="min-h-screen flex flex-col items-center justify-center px-4">
      <div class="max-w-xl w-full">
        <div class="p-8 rounded-2xl dark:bg-slate-700 bg-white shadow-lg">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h1 class="text-2xl font-bold dark:text-white text-gray-800">{{ $t("Account page") || "Fiók" }}</h1>
              <h2 class="text-gray-600 dark:text-gray-300 mt-1">{{ $t("welcome") || "Üdvözlünk" }}, {{ username }}!</h2>
            </div>
            <div class="w-16 h-16 rounded-full bg-sky-500/20 dark:bg-sky-400/20 flex items-center justify-center">
              <i class="pi pi-user text-2xl text-sky-600 dark:text-sky-400"></i>
            </div>
          </div>

          <!-- Settings section -->
          <div class="border-t border-gray-200 dark:border-gray-600 pt-6 mb-6">
            <h3 class="text-lg font-semibold dark:text-white text-gray-800 mb-4">{{ $t("settings") || "Beállítások" }}</h3>

            <v-switch
              class="ctextfield"
              v-model="animation_backgound"
              :label="$t('disable_animation_background') || 'Háttéranimáció kikapcsolása'"
              @change="set_user_setting"
              color="primary"
            ></v-switch>
          </div>

          <!-- Logout button -->
          <div class="flex gap-3">
            <v-btn
              color="error"
              @click="logout"
              :loading="isLoggingOut"
              :disabled="isLoggingOut"
              block
            >
              <i class="pi pi-sign-out mr-2"></i>
              {{ $t("logout") || "Kijelentkezés" }}
            </v-btn>
          </div>
        </div>
      </div>
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
    const errorMessage = ref("");
    const isLoading = ref(false);
    const isLoggingOut = ref(false);
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
      if (!email.value || !password.value) {
        errorMessage.value = "Kérlek, töltsd ki az összes mezőt!";
        return;
      }

      isLoading.value = true;
      errorMessage.value = "";

      try {
        const response = await user.createEmailPasswordSession(email.value, password.value);
        loadingStore.setUserLoggedin(true);
        loadingStore.setuid(response.userId);
        username.value = response.email;
        getUserSettings();

        // Success - clear form
        email.value = "";
        password.value = "";

        // Optional: redirect after short delay
        setTimeout(() => {
          router.push("/home");
        }, 500);
      } catch (err: any) {
        console.error("Login failed", err);

        // User-friendly error messages
        if (err.code === 401) {
          errorMessage.value = "Hibás e-mail cím vagy jelszó. Kérlek, próbáld újra!";
        } else if (err.code === 429) {
          errorMessage.value = "Túl sok próbálkozás. Kérlek, várj néhány percet!";
        } else if (err.message) {
          errorMessage.value = err.message;
        } else {
          errorMessage.value = "Bejelentkezési hiba történt. Kérlek, próbáld újra később!";
        }
      } finally {
        isLoading.value = false;
      }
    };

    const logout = async () => {
      isLoggingOut.value = true;
      try {
        const account = new Account(appw);
        await account.deleteSession("current");
        loadingStore.setUserLoggedin(false);
        loadingStore.setuid("");
        router.push("/home");
      } catch (err) {
        console.error("Logout failed", err);
        errorMessage.value = "Kijelentkezési hiba történt.";
      } finally {
        isLoggingOut.value = false;
      }
    };

    const getUserSettings = async () => {
      // TODO: implement Appwrite settings read from DB
      // For now we just use store value
      animation_backgound.value = loadingStore.animation || false;
    };

    const set_user_setting = () => {
      loadingStore.setAnimation(animation_backgound.value);
      // TODO: Save to Appwrite database
      console.log("Animation background changed:", animation_backgound.value);
    };

    onMounted(() => {
      document.title = "Login - Technička Škola Ada";
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
      errorMessage,
      isLoading,
      isLoggingOut,
    };
  },
};
</script>

<style scoped>
.ctextfield {
  margin-bottom: 1rem;
}
</style>
