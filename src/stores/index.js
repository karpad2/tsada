import { defineStore } from 'pinia';


 const useLoadingStore = defineStore({
    id: 'loading',
    state: () => ({
      isLoading: false
    }),
    actions: {
      setLoading(value) {
        this.isLoading = value;
      }
    }
  });
  export default useLoadingStore;