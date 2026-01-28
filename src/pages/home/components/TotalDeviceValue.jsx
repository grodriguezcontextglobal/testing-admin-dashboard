import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
// import CardRendered from "../../events/quickGlance/components/CardRendered"
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import Loading from "../../../components/animation/Loading";
import CenteringGrid from "../../../styles/global/CenteringGrid";
const ReusableCard = lazy(() =>
  import("../../../components/UX/cards/ReusableCard")
    // "../../../components/UX/cards/ReusableCard")
);
const TotalDevice = () => {
  const { user } = useSelector((state) => state.admin);
  const [device, setDevice] = useState("");
  const totalConsumers = useCallback(async () => {
    const response = await devitrakApi.post("db_item/consulting-item", {
      company_id: user.sqlInfo.company_id,
    });
    if (response.data.ok) {
      sortingDataFetched(response.data.items);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    totalConsumers();

    return () => {
      controller.abort();
    };
  }, []);

  const sortingDataFetched = (props) => {
    const result = new Set();
    for (let data of props) {
      result.add({ key: data.item_id, ...data });
    }
    const total = Array.from(result).reduce(
      (accu, { cost }) => accu + Number(cost),
      0
    );
    const format = Number(total).toLocaleString("en-US");
    return setDevice(`$${format}`);
  };

  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
        </div>
      }
    >
      <ReusableCard props={device} title={"Total device value"} />
    </Suspense>
  );
};

export default TotalDevice;
