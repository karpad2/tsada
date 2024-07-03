
import { defineStore,acceptHMRUpdate  } from 'pinia';
import { ref, computed } from 'vue'

export const useCookieStore = defineStore('cookie', () => {
    
    const isCookie = ref(false);
    
    
   
    function setCookie(v)
    {
      this.isCookie=v;
    }
   
  
    return {isCookie,setCookie }
  },
{persist:true})

  /*if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useAuth, import.meta.hot))
  }*/