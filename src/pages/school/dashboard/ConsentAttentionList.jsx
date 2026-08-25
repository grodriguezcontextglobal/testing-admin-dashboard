import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SelectComponent from "../../../components/UX/dropdown/SelectComponent";
import Input from "../../../components/UX/inputs/Input";
import { StatusChip } from "../../../components/UX/profile";
import {
  ATTENTION_PAGE_SIZE,
  attentionGrades,
  attentionStatusCounts,
  filterAttentionRows,
  pageOfAttentionRows,
} from "./attentionList";
import "./consentAttention.css";

/** Status → what the pill says and how loud the row's severity rail is. */
const STATUS_PRESENTATION = {
  missing: { label: "Consent not requested", tone: "critical", rail: "critical" },
  refused: { label: "Guardian refused", tone: "critical", rail: "critical" },
  expired: { label: "Consent link expired", tone: "critical", rail: "warning" },
  stale: { label: "New policy — reconsent", tone: "warning", rail: "warning" },
  pending: { label: "Awaiting guardian", tone: "warning", rail: "warning" },
};

const ALL_GRADES = { id: "", label: "All grades" };

/**
 * The students who cannot be given a device yet.
 *
 * Every outstanding student used to render at once, one flex row each: fine for
 * the twelve-student demo roster this was built against, unusable for a
 * district where the honest answer is five thousand. Nothing could be searched,
 * nothing could be narrowed, and the browser had to lay out every row to show
 * the first ten.
 *
 * So: the status chips double as filters and carry their own counts, the list
 * pages, and a row is a grid rather than one flex line -- name and its detail
 * stacked on the left, status and action on the right, with room to breathe
 * between two adjacent students.
 */
const ConsentAttentionList = ({ rows, describeRow, audienceLabel = "students" }) => {
  const [status, setStatus] = useState(null);
  const [search, setSearch] = useState("");
  const [gradeOption, setGradeOption] = useState(ALL_GRADES);
  const [page, setPage] = useState(1);

  const grade = gradeOption?.id || "";

  // Any narrowing puts you back at the top; page 7 of the old result set means
  // nothing under the new one.
  useEffect(() => setPage(1), [status, search, grade]);

  const chips = useMemo(() => attentionStatusCounts(rows), [rows]);
  const grades = useMemo(() => attentionGrades(rows), [rows]);
  const filtered = useMemo(
    () => filterAttentionRows(rows, { search, status, grade }),
    [rows, search, status, grade]
  );
  // Only this page is ever handed to the DOM.
  const view = useMemo(() => pageOfAttentionRows(filtered, page), [filtered, page]);

  const gradeItems = [ALL_GRADES, ...grades.map((value) => ({ id: value, label: `Grade ${value}` }))];
  const isFiltered = Boolean(status || search.trim() || grade);

  return (
    <>
      <div className="consent-attention__controls">
        <div className="consent-attention__chips">
          <button
            type="button"
            className="consent-attention__chip"
            aria-pressed={status === null}
            onClick={() => setStatus(null)}
          >
            All
            <span className="consent-attention__chip-count">{rows.length}</span>
          </button>
          {chips.map((chip) => (
            <button
              key={chip.value}
              type="button"
              className="consent-attention__chip"
              aria-pressed={status === chip.value}
              onClick={() => setStatus(status === chip.value ? null : chip.value)}
            >
              {chip.label}
              <span className="consent-attention__chip-count">{chip.count}</span>
            </button>
          ))}
        </div>

        <div className="consent-attention__search">
          <Input
            id="consent-attention-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search ${audienceLabel} or guardian email`}
            // On the inner input, not the MUI root: an aria-label on the
            // wrapper names a div and leaves the field itself unnamed.
            inputProps={{ "aria-label": `Search ${audienceLabel}` }}
          />
        </div>

        {grades.length > 1 && (
          <div className="consent-attention__grade">
            <SelectComponent
              items={gradeItems}
              value={gradeOption}
              onSelect={(option) => setGradeOption(option ?? ALL_GRADES)}
              placeholder="All grades"
            />
          </div>
        )}
      </div>

      {view.rows.length === 0 ? (
        <p className="consent-attention__empty">
          {isFiltered
            ? "No one matches those filters."
            : "No outstanding consent actions. 🎉"}
        </p>
      ) : (
        view.rows.map((row) => {
          const meta = STATUS_PRESENTATION[row.status] ?? STATUS_PRESENTATION.missing;
          const detail = describeRow?.(row);

          return (
            <div className="consent-attention__row" key={`${row.status}-${row.memberId}`}>
              <span
                className={`consent-attention__rail consent-attention__rail--${meta.rail}`}
                aria-hidden="true"
              />

              <div className="consent-attention__identity">
                <span className="consent-attention__name">{row.name}</span>
                <span className="consent-attention__meta">
                  {row.flags?.dob_valid && (
                    <>
                      <span
                        className={
                          row.flags.under_13 ? "consent-attention__coppa" : undefined
                        }
                      >
                        {row.flags.under_13
                          ? `Age ${row.flags.age} · under 13`
                          : `Age ${row.flags.age}`}
                      </span>
                      <span className="consent-attention__meta-sep">·</span>
                    </>
                  )}
                  {row.grade && (
                    <>
                      <span>Grade {row.grade}</span>
                      <span className="consent-attention__meta-sep">·</span>
                    </>
                  )}
                  <span>{detail}</span>
                </span>
              </div>

              <div className="consent-attention__actions">
                <StatusChip label={meta.label} tone={meta.tone} pip />
                {row.orphan ? (
                  <span className="consent-attention__no-record">no student record</span>
                ) : (
                  <Link className="consent-attention__review" to={`/member/${row.memberId}/main`}>
                    Review →
                  </Link>
                )}
              </div>
            </div>
          );
        })
      )}

      {view.total > ATTENTION_PAGE_SIZE && (
        <div className="consent-attention__pager">
          <p className="consent-attention__range">
            Showing {view.firstShown}–{view.lastShown} of {view.total}
            {isFiltered ? ` (filtered from ${rows.length})` : ""}
          </p>
          <div className="consent-attention__pager-buttons">
            <button
              type="button"
              className="consent-attention__page-button"
              disabled={view.page <= 1}
              onClick={() => setPage(view.page - 1)}
            >
              Previous
            </button>
            <span className="consent-attention__range">
              Page {view.page} of {view.totalPages}
            </span>
            <button
              type="button"
              className="consent-attention__page-button"
              disabled={view.page >= view.totalPages}
              onClick={() => setPage(view.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
};

ConsentAttentionList.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  /** Turns a row into its one-line detail, e.g. "requested 3 Jul · asked …". */
  describeRow: PropTypes.func,
  audienceLabel: PropTypes.string,
};

export default ConsentAttentionList;
