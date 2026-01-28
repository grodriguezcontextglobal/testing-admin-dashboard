import ReusableCard from "../../../../../components/UX/cards/ReusableCard";

export const KPI = ({ label, value }) => (
  <ReusableCard title={label} props={String(value ?? 0)} />
);
