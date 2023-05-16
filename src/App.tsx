import { useEffect } from "react";
import Layout from "./components/Layout/Layout";
import Scene from "./components/Scene/Scene";
import sound from "/song/asd.mp3";

const App = () => {
  const play = () => {
    new Audio(sound).play();
  };

  useEffect(() => {
    play();
  }, []);

  return (
    <Layout>
      <Scene />
    </Layout>
  );
};

export default App;
