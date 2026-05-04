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

  return os.state.currentUser ? <Desktop /> : <Boot />;
};

export default Index;
