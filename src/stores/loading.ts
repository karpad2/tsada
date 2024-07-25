
import { defineStore,acceptHMRUpdate  } from 'pinia';
import { ref, computed } from 'vue'

export const useLoadingStore = defineStore('loading', () => {
    const count = ref(0)
    const isLoading = ref(false);
    const isErasmus = ref(false);
    const userLoggedin=ref(false);
    const animationSetting=ref(false);
    const fireworkSetting=ref(false);
    const language=ref("sr");
    const uid=ref("");
    let notif=ref([]);
    const doubleCount = computed(() => count.value * 2)
    function increment() {
      count.value++
    }
    function setLoading(v)
    {
      this.isLoading=v;
    }
    function setErasmus(v)
    {
      this.isErasmus=v;
    }
    function setUserLoggedin(v)
    {
      this.userLoggedin=v;
    }
    function setAnimation(v)
    {
      this.animationSetting=v;
    }
    function setLanguage(v:string)
    {
      this.language=v;
    }
    function setuid(v:string)
    {
      this.uid=v;
    }

    function setfireworkSetting(v:boolean)
    {
      this.fireworkSetting=v;
    }

    


    return { count,isLoading,language,setLoading,setErasmus,setUserLoggedin,setLanguage,userLoggedin,notif,isErasmus, doubleCount,setAnimation,animationSetting,uid,setuid, increment,fireworkSetting,setfireworkSetting }
  },
{persist:true})

  /*if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useAuth, import.meta.hot))
  }*/