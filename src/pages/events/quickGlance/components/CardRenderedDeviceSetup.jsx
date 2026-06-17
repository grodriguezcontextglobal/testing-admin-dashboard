import { Switch, Tooltip } from "antd";
import { lazy, Suspense, useMemo, useState } from "react";
import Loading from "../../../../components/animation/Loading";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import ReusableCardWithHeaderAndFooter from "../../../../components/UX/cards/ReusableCardWithHeaderAndFooter";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { Subtitle } from "../../../../styles/global/Subtitle";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import ModalAllItemsBasedOnGroup from "./ModalAllItemsBasedOnGroup";
import { ProgressBar } from "../../../../components/base/progress-indicators/progress-indicators";
const ModalAddAndUpdateDeviceSetup = lazy(
  () => import("./ModalAddAndUpdateDeviceSetup"),
);

const CardRendered = ({ props, title, onChange, loadingStatus, database }) => {
  const [openModalDeviceSetup, setOpenModalDeviceSetup] = useState(false);
  const [openModalItemList, setOpenModalItemList] = useState(false);

  const poolCount = useMemo(() => {
    const raw = database?.receiversInventory;
    if (!raw) return 0;
    try {
      const data = typeof raw === "string" ? JSON.parse(raw) : raw;
      return data.filter((inv) => inv.type === title).length;
    } catch {
      return 0;
    }
  }, [database, title]);

  const poolPct =
    props.quantity > 0 ? Math.min((poolCount / props.quantity) * 100, 100) : 0;

  const hasSerialNumbers =
    props.startingNumber !== null && props.endingNumber !== null;

  const cardFooter = (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "8px",
        width: "100%",
      }}
    >
      {hasSerialNumbers && (
        <GrayButtonComponent
          size="sm"
          title="View"
          func={() => setOpenModalItemList(true)}
        />
      )}
      <BlueButtonComponent
        size="sm"
        title="Allocate items"
        func={() => setOpenModalDeviceSetup(true)}
        styles={{ marginRight: "8px" }}
      />
    </div>
  );

  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
        </div>
      }
    >
      <ReusableCardWithHeaderAndFooter
        title={title}
        actions={[cardFooter]}
        style={{ minWidth: "260px", width: "100%" }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            paddingTop: "8px",
          }}
        >
          {/* Total set for event + pool count */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <p style={TextFontSize30LineHeight38}>{props.quantity}</p>
              <p style={{ ...Subtitle, marginTop: "2px" }}>Set for event</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={TextFontSize30LineHeight38}>{poolCount}</p>
              <p style={{ ...Subtitle, marginTop: "2px" }}>In event pool</p>
            </div>
          </div>

          {/* Pool assignment progress */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <p style={Subtitle}>Assigned to event</p>
              <p style={{ ...Subtitle, fontWeight: 500, color: "var(--gray-900, #101828)" }}>
                {poolCount}&nbsp;/&nbsp;{props.quantity}
              </p>
            </div>
            <ProgressBar labelPosition="right" min={0} max={100} value={poolPct} />
          </div>

          {/* Consumer / internal toggle */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "4px",
              borderTop: "1px solid var(--gray-100, #F2F4F7)",
            }}
          >
            <p style={Subtitle}>
              {props.consumerUses ? "Consumer use" : "Internal use"}
            </p>
            <Tooltip
              title={`${props.consumerUses ? "For consumers." : "For internal use."}`}
            >
              <Switch
                checked={props.consumerUses}
                loading={loadingStatus}
                onChange={onChange}
              />
            </Tooltip>
          </div>
        </div>
      </ReusableCardWithHeaderAndFooter>

      {openModalDeviceSetup && (
        <ModalAddAndUpdateDeviceSetup
          openModalDeviceSetup={openModalDeviceSetup}
          setOpenModalDeviceSetup={setOpenModalDeviceSetup}
          deviceTitle={title}
          quantity={props.quantity}
          category_name={props.item.category}
        />
      )}
      {openModalItemList && hasSerialNumbers && (
        <ModalAllItemsBasedOnGroup
          openModalItemList={openModalItemList}
          setOpenModalItemList={setOpenModalItemList}
          deviceTitle={title}
          database={database}
        />
      )}
    </Suspense>
  );
};

export default CardRendered;
