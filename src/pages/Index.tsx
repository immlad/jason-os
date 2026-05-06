import { useEffect } from "react";
import { useOS } from "@/os/store";
import { Boot } from "@/os/components/Boot";
import { Desktop } from "@/os/Desktop";

const Index = () => {
  const os = useOS();

  useEffect(() => {
    document.title = "JASON OS";
    if (!document.body.className.includes("theme-")) {
      document.body.classList.add(`theme-${os.state.theme}`);
    }
  }, [os.state.theme]);

  if (os.state.loading) {
    return <div className="fixed inset-0 grid place-items-center bg-black text-white/70 text-sm">Booting JASON OS…</div>;
  }
  return os.state.currentUserId ? <Desktop /> : <Boot />;
};

export default Index;
