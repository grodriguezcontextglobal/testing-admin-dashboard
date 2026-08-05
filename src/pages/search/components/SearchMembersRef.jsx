import { Pagination } from "antd";
import { PropTypes } from "prop-types";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { onAddMemberInfo } from "../../../store/slices/memberSlice";
import CardMemberFound from "../utils/CardMemberFound";
import SearchSection from "./SearchSection";
import {
  cardGrid,
  sectionFooter,
  SECTION_NOTE,
} from "../utils/sectionLayout";

const PAGE_SIZE = 12;


/**
 * The people a company assigns devices to (MySQL members_info) — labelled by
 * industry, so an education account reads "Students". Selecting one follows the
 * same path the members table uses: stash the row, then open its detail page.
 */
const SearchMembersRef = ({ data, searchParams, label = "Members" }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const members = data?.members ?? [];
  const total = Number(data?.total ?? members.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchParams, data]);

  const pageMembers = members.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleMemberDetail = (record) => {
    dispatch(onAddMemberInfo(record));
    return navigate(`/member/${record.member_id}/main`);
  };

  return (
    <SearchSection
      title={label}
      subtitle={`All ${String(label).toLowerCase()} matching your search.`}
    >
      <div style={cardGrid(280)}>
        {pageMembers.map((member) => (
          <CardMemberFound
            key={member.member_id}
            props={member}
            fn={handleMemberDetail}
          />
        ))}
      </div>

      {members.length > PAGE_SIZE && (
        <div style={sectionFooter}>
          <Pagination
            current={currentPage}
            pageSize={PAGE_SIZE}
            total={members.length}
            onChange={setCurrentPage}
            showSizeChanger={false}
            showTotal={(count, range) => `${range[0]}–${range[1]} of ${count}`}
          />
        </div>
      )}

      {data?.hasMore && (
        <p style={SECTION_NOTE}>
          Showing the first {members.length} of {total} matches. Narrow the
          keyword to see the rest.
        </p>
      )}
    </SearchSection>
  );
};

export default SearchMembersRef;

SearchMembersRef.propTypes = {
  data: PropTypes.object,
  searchParams: PropTypes.string,
  label: PropTypes.string,
};
