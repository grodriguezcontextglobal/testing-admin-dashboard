import Lottie from "lottie-web";
import { useEffect, useRef } from "react";
import animationData from "../json/oWKlmV36kM.json";

const Loading = () => {
    const container = useRef(null);
    useEffect(() => {
        const lottieAnimation = Lottie.loadAnimation({
            container: container.current,
            renderer: "svg",
            loop: true,
            autoplay: true,
            animationData: animationData,
        });

        return () => {
            lottieAnimation.destroy();
        };
    }, []);

    return (
        <div
            style={{
                width: "10vw",
                height: "10vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    margin: "0 auto",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
                ref={container}
            ></div>
        </div>
    );
};

export default Loading;
