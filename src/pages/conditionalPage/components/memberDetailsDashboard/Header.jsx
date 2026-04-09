import { Divider } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../../../components/UX/breadcrumbs/Breadcrumb";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import RefactoredHeaderUntitledUiReact from "../../../../components/UX/header/DynamicHeaderCompnent";
import Loading from "../../../../components/animation/Loading";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";

const MemberInfoHeader = ({ memberInfo, groupName, setAddingNewMember }) => {
  const detailMemberInfo = memberInfo?.at(-1);
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();

  if (!detailMemberInfo) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Loading />
      </div>
    );
  }
    const style = {
      titleNavigation: {
        textTransform: "none",
        textAlign: "left",
        fontWeight: 600,
        fontSize: "18px",
        fontFamily: "Inter",
        lineHeight: "28px",
        color: "var(--blue-dark-600, #155EEF)",
        cursor: "pointer"
      },
      breadcrumbTitle: {
        ...TextFontsize18LineHeight28,
        textTransform: "none",
      },
    };

  const breadcrumbItems = [
    {
      title: <p style={style.titleNavigation} onClick={() => navigate("/members", { state: { referencing: groupName } })}>All {groupName}</p>,
      link: "/members",
      state: { referencing: groupName },
    },
    {
      title: <p style={style.breadcrumbTitle}>{`${detailMemberInfo?.first_name}, ${detailMemberInfo?.last_name}`}</p>,
    },
  ];

  const actions = {
    desktop: Number(user.role) < 2 ? (
      <BlueButtonComponent
        title={"Add new member"}
        func={() => setAddingNewMember(true)}
      />
    ) : null,
    mobile: Number(user.role) < 2 ? (
      <BlueButtonComponent
        title={"Add new"}
        func={() => setAddingNewMember(true)}
      />
    ) : null,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Breadcrumb path={breadcrumbItems} />
      <Divider style={{ margin:"0.5rem 0"}}/>
      <RefactoredHeaderUntitledUiReact
        title={`${detailMemberInfo?.first_name} ${detailMemberInfo?.last_name ?? ""}`}
        subtitle={detailMemberInfo?.external_id ? `External ID: ${detailMemberInfo.external_id}` : null}
        actions={actions.desktop}
        image={detailMemberInfo?.image_url}
        centerContentComponentTitle={"Contact"}
        email={detailMemberInfo?.email}
        phone={detailMemberInfo?.phone_number ?? "+1-000-000-0000"}
      />
    </div>
  );
};

export default MemberInfoHeader;
