<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-950">
    <!-- Login form -->
    <div v-if="!isLoggedin" class="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div class="max-w-md w-full">
        <!-- Logo/Brand section -->
        <div class="text-center mb-8 fade-in">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 shadow-2xl shadow-blue-500/30 dark:shadow-blue-500/20 mb-4">
            <i class="pi pi-user text-3xl text-white"></i>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">{{ $t("login") }}</h1>
          <p class="text-gray-700 dark:text-gray-300">{{ $t("welcome_back") || "Jelentkezz be a fiókodba" }}</p>
        </div>

        <!-- Login Card -->
        <div class="card-slide-up bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="p-8">
            <!-- Error message -->
            <Transition name="error-fade">
              <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border-l-4 border-red-500 dark:border-red-500 rounded-lg shadow-sm dark:shadow-red-500/10">
                <div class="flex items-start">
                  <i class="pi pi-exclamation-circle text-red-600 dark:text-red-400 mt-0.5 mr-3"></i>
                  <p class="text-red-700 dark:text-red-300 text-sm font-medium">{{ errorMessage }}</p>
                </div>
              </div>
            </Transition>

            <form @submit.prevent="login_by_app" class="space-y-5">
              <div class="space-y-4">
                <v-text-field
                  class="custom-input"
                  type="email"
                  v-model="email"
                  :label="$t('email')"
                  :disabled="isLoading"
                  variant="outlined"
                  prepend-inner-icon="mdi-email"
                  required
                  autocomplete="email"
                  bg-color="transparent"
                ></v-text-field>

                <v-text-field
                  class="custom-input"
                  :type="showPassword ? 'text' : 'password'"
                  v-model="password"
                  :label="$t('password')"
                  :disabled="isLoading"
                  variant="outlined"
                  prepend-inner-icon="mdi-lock"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showPassword = !showPassword"
                  required
                  autocomplete="current-password"
                  bg-color="transparent"
                ></v-text-field>
              </div>

              <!-- Remember me & Forgot password -->
              <div class="flex items-center justify-between">
                <v-checkbox
                  v-model="rememberMe"
                  :label="$t('remember_me') || 'Emlékezz rám'"
                  hide-details
                  density="compact"
                  color="primary"
                ></v-checkbox>
                <a
                  href="#"
                  @click.prevent="showForgotPassword = true"
                  class="text-sm text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-medium transition-colors"
                >
                  {{ $t('forgot_password') || 'Elfelejtett jelszó?' }}
                </a>
              </div>

              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                :loading="isLoading"
                :disabled="isLoading"
                class="!mt-6 text-base font-semibold rounded-xl !h-12 shadow-lg hover:shadow-xl dark:shadow-sky-500/30 dark:hover:shadow-sky-500/50 transition-all"
              >
                <i class="pi pi-sign-in mr-2"></i>
                {{ isLoading ? $t("logging_in") || "Bejelentkezés..." : $t("login") }}
              </v-btn>
            </form>

            <!-- Forgot Password Dialog -->
            <v-dialog v-model="showForgotPassword" max-width="500">
              <v-card class="rounded-xl">
                <v-card-title class="text-xl font-bold pt-6 px-6">
                  <i class="pi pi-key mr-2 text-sky-600 dark:text-sky-400"></i>
                  {{ $t('forgot_password') || 'Elfelejtett jelszó' }}
                </v-card-title>
                <v-card-text class="px-6 py-4">
                  <p class="text-gray-600 dark:text-gray-400 mb-4">
                    Add meg az email címed és küldünk egy jelszó visszaállítási linket.
                  </p>
                  <v-text-field
                    v-model="resetEmail"
                    :label="$t('email')"
                    type="email"
                    variant="outlined"
                    prepend-inner-icon="mdi-email"
                    bg-color="transparent"
                  ></v-text-field>
                  <p v-if="resetMessage" :class="resetMessageType === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" class="text-sm mt-2">
                    {{ resetMessage }}
                  </p>
                </v-card-text>
                <v-card-actions class="px-6 pb-6">
                  <v-spacer></v-spacer>
                  <v-btn
                    @click="showForgotPassword = false"
                    variant="text"
                  >
                    {{ $t('cancel') || 'Mégse' }}
                  </v-btn>
                  <v-btn
                    @click="sendPasswordReset"
                    color="primary"
                    :loading="isResetting"
                  >
                    {{ $t('send') || 'Küldés' }}
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </div>
        </div>

        <!-- Footer info -->
        <p class="text-center text-gray-500 dark:text-gray-500 text-sm mt-6 fade-in-delayed">
          Technička Škola Ada
        </p>
      </div>
    </div>

    <!-- Logged in view -->
    <div v-else class="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div class="max-w-2xl w-full">
        <!-- Account Card -->
        <div class="card-slide-up bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
          <!-- Header with gradient background -->
          <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <h1 class="text-3xl font-bold text-white mb-2">
                  {{ $t("Account page") || "Fiók" }}
                </h1>
                <p class="text-blue-100 text-lg">
                  {{ $t("welcome") || "Üdvözlünk" }}, <span class="font-semibold">{{ username }}</span>!
                </p>
              </div>
              <div class="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/40 shadow-xl">
                <i class="pi pi-user text-4xl text-white"></i>
              </div>
            </div>
          </div>

          <!-- Account Info Section -->
          <div class="px-8 py-6 border-b-2 border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-4 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
              <div class="flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 shadow-lg">
                <i class="pi pi-envelope text-white text-xl"></i>
              </div>
              <div>
                <p class="text-xs text-blue-800 dark:text-blue-300 uppercase tracking-wide font-bold">Email</p>
                <p class="text-gray-900 dark:text-white font-semibold text-lg">{{ username }}</p>
              </div>
            </div>
          </div>

          <!-- Account Stats -->
          <div class="px-8 py-6 border-b-2 border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3 mb-5">
              <div class="p-2.5 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40">
                <i class="pi pi-chart-line text-purple-700 dark:text-purple-300 text-xl"></i>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                {{ $t("account_info") || "Fiók információk" }}
              </h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Registration Date -->
              <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border-2 border-green-200 dark:border-green-800 hover:shadow-lg transition-all">
                <div class="flex items-center gap-3">
                  <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-green-600 shadow-md">
                    <i class="pi pi-calendar text-white text-lg"></i>
                  </div>
                  <div>
                    <p class="text-xs text-green-800 dark:text-green-300 uppercase tracking-wide font-bold">Regisztráció</p>
                    <p class="font-bold text-gray-900 dark:text-white">{{ accountCreatedAt || 'N/A' }}</p>
                  </div>
                </div>
              </div>

              <!-- Last Login -->
              <div class="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-5 border-2 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all">
                <div class="flex items-center gap-3">
                  <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600 shadow-md">
                    <i class="pi pi-clock text-white text-lg"></i>
                  </div>
                  <div>
                    <p class="text-xs text-blue-800 dark:text-blue-300 uppercase tracking-wide font-bold">Utolsó belépés</p>
                    <p class="font-bold text-gray-900 dark:text-white">{{ lastLogin || 'Éppen most' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Settings section -->
          <div class="px-8 py-6 border-b-2 border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3 mb-5">
              <div class="p-2.5 rounded-xl bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-900/40 dark:to-gray-900/40">
                <i class="pi pi-cog text-slate-700 dark:text-slate-300 text-xl"></i>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                {{ $t("settings") || "Beállítások" }}
              </h3>
            </div>

            <div class="space-y-4">
              <!-- Animation Setting -->
              <div class="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-5 border-2 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all">
                <div class="flex items-center justify-between">
                  <div class="flex items-start gap-3">
                    <div class="flex items-center justify-center w-11 h-11 rounded-lg bg-purple-600 shadow-md">
                      <i class="pi pi-sparkles text-white"></i>
                    </div>
                    <div>
                      <p class="font-bold text-gray-900 dark:text-white">
                        {{ $t('disable_animation_background') || 'Háttéranimáció' }}
                      </p>
                      <p class="text-sm text-purple-900 dark:text-purple-300 mt-0.5">
                        Animált háttér be/kikapcsolása
                      </p>
                    </div>
                  </div>
                  <v-switch
                    v-model="animation_backgound"
                    @change="set_user_setting"
                    color="primary"
                    hide-details
                    inset
                  ></v-switch>
                </div>
              </div>

              <!-- Password Change Button -->
              <div class="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-5 border-2 border-amber-200 dark:border-amber-800 hover:shadow-lg transition-all">
                <div class="flex items-center justify-between">
                  <div class="flex items-start gap-3">
                    <div class="flex items-center justify-center w-11 h-11 rounded-lg bg-amber-600 shadow-md">
                      <i class="pi pi-lock text-white"></i>
                    </div>
                    <div>
                      <p class="font-bold text-gray-900 dark:text-white">
                        Jelszó módosítás
                      </p>
                      <p class="text-sm text-amber-900 dark:text-amber-300 mt-0.5">
                        Változtasd meg a jelszavad
                      </p>
                    </div>
                  </div>
                  <v-btn
                    @click="showChangePassword = true"
                    color="primary"
                    variant="outlined"
                    size="small"
                  >
                    Módosítás
                  </v-btn>
                </div>
              </div>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="px-8 py-6 bg-gray-50/50 dark:bg-slate-900/30">
            <v-btn
              color="error"
              size="large"
              @click="logout"
              :loading="isLoggingOut"
              :disabled="isLoggingOut"
              block
              class="rounded-xl !h-12 font-semibold shadow-lg hover:shadow-xl dark:shadow-red-500/20 dark:hover:shadow-red-500/40 transition-all"
            >
              <i class="pi pi-sign-out mr-2"></i>
              {{ $t("logout") || "Kijelentkezés" }}
            </v-btn>
          </div>

          <!-- Change Password Dialog -->
          <v-dialog v-model="showChangePassword" max-width="500">
            <v-card class="rounded-xl">
              <v-card-title class="text-xl font-bold pt-6 px-6">
                <i class="pi pi-lock mr-2 text-amber-600 dark:text-amber-400"></i>
                Jelszó módosítás
              </v-card-title>
              <v-card-text class="px-6 py-4">
                <div class="space-y-4">
                  <v-text-field
                    v-model="oldPassword"
                    :type="showOldPassword ? 'text' : 'password'"
                    label="Jelenlegi jelszó"
                    variant="outlined"
                    prepend-inner-icon="mdi-lock"
                    :append-inner-icon="showOldPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showOldPassword = !showOldPassword"
                    bg-color="transparent"
                  ></v-text-field>

                  <v-text-field
                    v-model="newPassword"
                    :type="showNewPassword ? 'text' : 'password'"
                    label="Új jelszó"
                    variant="outlined"
                    prepend-inner-icon="mdi-lock-plus"
                    :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showNewPassword = !showNewPassword"
                    bg-color="transparent"
                  ></v-text-field>

                  <v-text-field
                    v-model="confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    label="Új jelszó megerősítése"
                    variant="outlined"
                    prepend-inner-icon="mdi-lock-check"
                    :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showConfirmPassword = !showConfirmPassword"
                    bg-color="transparent"
                  ></v-text-field>

                  <p v-if="passwordChangeMessage" :class="passwordChangeType === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" class="text-sm">
                    {{ passwordChangeMessage }}
                  </p>
                </div>
              </v-card-text>
              <v-card-actions class="px-6 pb-6">
                <v-spacer></v-spacer>
                <v-btn
                  @click="closePasswordDialog"
                  variant="text"
                >
                  Mégse
                </v-btn>
                <v-btn
                  @click="changePassword"
                  color="primary"
                  :loading="isChangingPassword"
                >
                  Jelszó módosítása
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </div>

        <!-- Footer info -->
        <p class="text-center text-gray-500 dark:text-gray-400 text-sm mt-6 fade-in-delayed">
          <noscript>Abandon all hope, ye who enter here </noscript> 
        </p>
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
    const showPassword = ref(false);
    const rememberMe = ref(false);
    const showForgotPassword = ref(false);
    const resetEmail = ref("");
    const resetMessage = ref("");
    const resetMessageType = ref<"success" | "error">("success");
    const isResetting = ref(false);

    // Password change
    const showChangePassword = ref(false);
    const oldPassword = ref("");
    const newPassword = ref("");
    const confirmPassword = ref("");
    const showOldPassword = ref(false);
    const showNewPassword = ref(false);
    const showConfirmPassword = ref(false);
    const passwordChangeMessage = ref("");
    const passwordChangeType = ref<"success" | "error">("success");
    const isChangingPassword = ref(false);

    // Account info
    const accountCreatedAt = ref("");
    const lastLogin = ref("");

    const loadingStore = useLoadingStore();

    const isLoggedin = computed(() => loadingStore.userLoggedin);

    const checkLogin = async () => {
      try {
        const account = new Account(appw);
        const session = await account.get();
        loadingStore.setUserLoggedin(true);
        username.value = session.name || session.email;
        loadingStore.setuid(session.$id);

        // Format account creation date
        if (session.registration) {
          const date = new Date(session.registration);
          accountCreatedAt.value = date.toLocaleDateString('hu-HU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }

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

    const sendPasswordReset = async () => {
      if (!resetEmail.value) {
        resetMessage.value = "Kérlek, add meg az email címed!";
        resetMessageType.value = "error";
        return;
      }

      isResetting.value = true;
      resetMessage.value = "";

      try {
        const account = new Account(appw);
        await account.createRecovery(
          resetEmail.value,
          `${window.location.origin}/reset-password`
        );
        resetMessage.value = "Jelszó visszaállítási email elküldve! Nézd meg a postaládád.";
        resetMessageType.value = "success";

        setTimeout(() => {
          showForgotPassword.value = false;
          resetEmail.value = "";
          resetMessage.value = "";
        }, 3000);
      } catch (err: any) {
        console.error("Password reset failed", err);
        resetMessage.value = err.message || "Hiba történt. Próbáld újra később!";
        resetMessageType.value = "error";
      } finally {
        isResetting.value = false;
      }
    };

    const changePassword = async () => {
      passwordChangeMessage.value = "";

      // Validation
      if (!oldPassword.value || !newPassword.value || !confirmPassword.value) {
        passwordChangeMessage.value = "Kérlek, töltsd ki az összes mezőt!";
        passwordChangeType.value = "error";
        return;
      }

      if (newPassword.value !== confirmPassword.value) {
        passwordChangeMessage.value = "Az új jelszavak nem egyeznek!";
        passwordChangeType.value = "error";
        return;
      }

      if (newPassword.value.length < 8) {
        passwordChangeMessage.value = "Az új jelszónak legalább 8 karakter hosszúnak kell lennie!";
        passwordChangeType.value = "error";
        return;
      }

      isChangingPassword.value = true;

      try {
        const account = new Account(appw);
        await account.updatePassword(newPassword.value, oldPassword.value);

        passwordChangeMessage.value = "Jelszó sikeresen megváltoztatva!";
        passwordChangeType.value = "success";

        setTimeout(() => {
          closePasswordDialog();
        }, 2000);
      } catch (err: any) {
        console.error("Password change failed", err);
        if (err.code === 401) {
          passwordChangeMessage.value = "Hibás jelenlegi jelszó!";
        } else {
          passwordChangeMessage.value = err.message || "Hiba történt a jelszó megváltoztatásakor!";
        }
        passwordChangeType.value = "error";
      } finally {
        isChangingPassword.value = false;
      }
    };

    const closePasswordDialog = () => {
      showChangePassword.value = false;
      oldPassword.value = "";
      newPassword.value = "";
      confirmPassword.value = "";
      passwordChangeMessage.value = "";
      showOldPassword.value = false;
      showNewPassword.value = false;
      showConfirmPassword.value = false;
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
      showPassword,
      rememberMe,
      showForgotPassword,
      resetEmail,
      resetMessage,
      resetMessageType,
      isResetting,
      sendPasswordReset,
      showChangePassword,
      oldPassword,
      newPassword,
      confirmPassword,
      showOldPassword,
      showNewPassword,
      showConfirmPassword,
      passwordChangeMessage,
      passwordChangeType,
      isChangingPassword,
      changePassword,
      closePasswordDialog,
      accountCreatedAt,
      lastLogin,
    };
  },
};
</script>

<style scoped>
/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.6s ease-out;
}

.fade-in-delayed {
  animation: fadeIn 0.8s ease-out 0.3s backwards;
}

.card-slide-up {
  animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Error message transition */
.error-fade-enter-active,
.error-fade-leave-active {
  transition: all 0.3s ease;
}

.error-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.error-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Custom input styling */
.custom-input {
  margin-bottom: 0;
}

/* Hover effects */
.v-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Backdrop blur support */
@supports (backdrop-filter: blur(10px)) {
  .backdrop-blur-sm {
    backdrop-filter: blur(10px);
  }

  .backdrop-blur-md {
    backdrop-filter: blur(16px);
  }
}
</style>
