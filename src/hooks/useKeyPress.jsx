import { useEffect } from "react";

const useKeyPress = (handler) => {
useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => {
        window.removeEventListener("keydown", handler);
    };
}, [handler]);
};

export default useKeyPress;
