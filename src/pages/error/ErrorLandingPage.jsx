import { useNavigate } from "react-router-dom";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import Home from "../../components/icons/Home";

const ErrorLandingPage = () => {
  const navigate = useNavigate();
  return (
    <section
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        padding: "64px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "32px",
          maxWidth: "480px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--blue700)",
              }}
            >
              404 error
            </span>
            <h1
              style={{
                fontSize: "48px",
                fontWeight: 600,
                color: "var(--gray-900, #101828)",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Page not found
            </h1>
          </div>
          <p
            style={{
              fontSize: "18px",
              color: "var(--gray-600, #475467)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Sorry, the page you are looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>
        <BlueButtonComponent
          size="xl"
          title="Take me home"
          iconLeading={<Home />}
          func={() => navigate("/")}
        />
      </div>
    </section>
  );
};

export default ErrorLandingPage;
