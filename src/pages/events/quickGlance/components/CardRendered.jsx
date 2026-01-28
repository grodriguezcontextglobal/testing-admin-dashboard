import ReusableCard from "../../../../components/UX/cards/ReusableCard";
import { Subtitle } from "../../../../styles/global/Subtitle";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";

const CardRendered = ({ props, title }) => {
  return (
    <ReusableCard
      title={title}
      props={props}
      style={{
        subtitle: Subtitle,
        textFontSize30LineHeight38: TextFontSize30LineHeight38,
      }}
    />
  );
};

export default CardRendered;
